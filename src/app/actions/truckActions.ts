'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export interface CreateTruckInput {
  truckCode: string
  policeNumber: string
  chassisNumber?: string
  engineNumber?: string
  brand?: string
  model?: string
  variant?: string
  vehicleType?: string
  driveConfiguration?: string
  transmission?: string
  fuelTankConfiguration?: string
  year?: number
  color?: string
  capacity?: string
  purchaseDate?: string
  purchasePrice?: number
  photoUrl?: string
  chassisImageUrl?: string
  notes?: string
}

export async function createTruckAction(input: CreateTruckInput) {
  // Server-side RBAC: Only OWNER can create trucks
  await requireOwner()

  if (!input.truckCode || !input.policeNumber) {
    return { error: 'Truck Code dan Nomor Polisi wajib diisi.' }
  }

  // Check unique constraints
  const existingCode = await prisma.truck.findUnique({
    where: { truckCode: input.truckCode },
  })
  if (existingCode) {
    return { error: `Truck Code "${input.truckCode}" sudah terdaftar.` }
  }

  const existingPolice = await prisma.truck.findUnique({
    where: { policeNumber: input.policeNumber },
  })
  if (existingPolice) {
    return { error: `Nomor Polisi "${input.policeNumber}" sudah terdaftar.` }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Truck record
    const truck = await tx.truck.create({
      data: {
        truckCode: input.truckCode,
        policeNumber: input.policeNumber,
        chassisNumber: input.chassisNumber || null,
        engineNumber: input.engineNumber || null,
        brand: input.brand || 'Mitsubishi',
        model: input.model || 'Fighter',
        variant: input.variant || 'F61L HD R',
        vehicleType: input.vehicleType || 'Tronton',
        driveConfiguration: input.driveConfiguration || '6x2',
        transmission: input.transmission || 'Manual Transmission (M/T)',
        fuelTankConfiguration: input.fuelTankConfiguration || 'Double Tank',
        year: input.year ? Number(input.year) : null,
        color: input.color || null,
        capacity: input.capacity || null,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        purchasePrice: input.purchasePrice ? Number(input.purchasePrice) : null,
        photoUrl: input.photoUrl || null,
        chassisImageUrl: input.chassisImageUrl || '/chassis-mitsubishi-6x2.png',
        notes: input.notes || null,
        totalKm: 0,
      },
    })

    // 2. Automatically generate the 10 standard 6x2 wheel position slots
    const positions = [
      { positionCode: 'FL', positionName: 'Axle 1 Depan Kiri', axleNumber: 1, axleType: 'STEER', side: 'LEFT', isInner: false },
      { positionCode: 'FR', positionName: 'Axle 1 Depan Kanan', axleNumber: 1, axleType: 'STEER', side: 'RIGHT', isInner: false },
      
      { positionCode: 'R1-LI', positionName: 'Axle 2 Belakang 1 Kiri Dalam', axleNumber: 2, axleType: 'DRIVE', side: 'LEFT', isInner: true },
      { positionCode: 'R1-LO', positionName: 'Axle 2 Belakang 1 Kiri Luar', axleNumber: 2, axleType: 'DRIVE', side: 'LEFT', isInner: false },
      { positionCode: 'R1-RI', positionName: 'Axle 2 Belakang 1 Kanan Dalam', axleNumber: 2, axleType: 'DRIVE', side: 'RIGHT', isInner: true },
      { positionCode: 'R1-RO', positionName: 'Axle 2 Belakang 1 Kanan Luar', axleNumber: 2, axleType: 'DRIVE', side: 'RIGHT', isInner: false },
      
      { positionCode: 'R2-LI', positionName: 'Axle 3 Belakang 2 Kiri Dalam', axleNumber: 3, axleType: 'DRIVE', side: 'LEFT', isInner: true },
      { positionCode: 'R2-LO', positionName: 'Axle 3 Belakang 2 Kiri Luar', axleNumber: 3, axleType: 'DRIVE', side: 'LEFT', isInner: false },
      { positionCode: 'R2-RI', positionName: 'Axle 3 Belakang 2 Kanan Dalam', axleNumber: 3, axleType: 'DRIVE', side: 'RIGHT', isInner: true },
      { positionCode: 'R2-RO', positionName: 'Axle 3 Belakang 2 Kanan Luar', axleNumber: 3, axleType: 'DRIVE', side: 'RIGHT', isInner: false },
    ]

    for (const pos of positions) {
      await tx.truckWheelPosition.create({
        data: {
          truckId: truck.id,
          ...pos,
        },
      })
    }

    return truck
  })

  await createAuditLog({
    action: 'CREATE_TRUCK',
    module: 'TRUCK',
    recordId: result.id,
    afterValue: result,
  })

  revalidatePath('/trucks')
  revalidatePath('/dashboard')
  return { success: true, truck: result }
}

export async function updateTruckMainPhotoAction(truckId: string, photoUrl: string) {
  await requireOwner()

  if (!photoUrl) {
    return { error: 'Foto wajib dipilih.' }
  }

  const updated = await prisma.truck.update({
    where: { id: truckId },
    data: { photoUrl },
  })

  await createAuditLog({
    action: 'UPDATE_TRUCK_MAIN_PHOTO',
    module: 'TRUCK',
    recordId: truckId,
    afterValue: updated,
  })

  revalidatePath('/trucks')
  revalidatePath(`/trucks/${truckId}`)
  revalidatePath('/dashboard')
  return { success: true, truck: updated }
}

export async function addTruckPhotoAction(params: {
  truckId: string
  url: string
  isPrimary?: boolean
  caption?: string
}) {
  await requireOwner()
  const { truckId, url, isPrimary, caption } = params

  if (!url) {
    return { error: 'URL foto wajib diisi.' }
  }

  const photo = await prisma.$transaction(async (tx) => {
    if (isPrimary) {
      // Clear other primary flags
      await tx.truckPhoto.updateMany({
        where: { truckId },
        data: { isPrimary: false },
      })
      // Update truck main photoUrl
      await tx.truck.update({
        where: { id: truckId },
        data: { photoUrl: url },
      })
    }

    const created = await tx.truckPhoto.create({
      data: {
        truckId,
        url,
        isPrimary: !!isPrimary,
        caption: caption || null,
      },
    })
    return created
  })

  await createAuditLog({
    action: 'TRUCK_PHOTO_UPLOAD',
    module: 'TRUCK',
    recordId: photo.id,
    afterValue: photo,
  })

  revalidatePath(`/trucks/${truckId}`)
  revalidatePath('/trucks')
  return { success: true, photo }
}

export async function deleteTruckPhotoAction(photoId: string) {
  await requireOwner()

  const photo = await prisma.truckPhoto.findUnique({ where: { id: photoId } })
  if (!photo) return { error: 'Foto tidak ditemukan.' }

  await prisma.$transaction(async (tx) => {
    await tx.truckPhoto.delete({ where: { id: photoId } })

    if (photo.isPrimary) {
      // Pick next photo as primary or set main photoUrl to null
      const nextPhoto = await tx.truckPhoto.findFirst({
        where: { truckId: photo.truckId },
        orderBy: { createdAt: 'desc' },
      })
      if (nextPhoto) {
        await tx.truckPhoto.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        })
        await tx.truck.update({
          where: { id: photo.truckId },
          data: { photoUrl: nextPhoto.url },
        })
      } else {
        await tx.truck.update({
          where: { id: photo.truckId },
          data: { photoUrl: null },
        })
      }
    }
  })

  await createAuditLog({
    action: 'TRUCK_PHOTO_DELETE',
    module: 'TRUCK',
    recordId: photoId,
    beforeValue: photo,
  })

  revalidatePath(`/trucks/${photo.truckId}`)
  revalidatePath('/trucks')
  return { success: true }
}

export async function getTrucksAction() {
  await requireAuth()
  return await prisma.truck.findMany({
    include: {
      photos: { orderBy: { createdAt: 'desc' } },
      wheelPositions: {
        include: {
          currentTire: true,
        },
      },
      shipments: true,
      tripContracts: {
        include: { legs: true, customer: true },
        orderBy: { createdAt: 'desc' },
      },
      maintenances: true,
      fuelLogs: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTruckByIdAction(truckId: string) {
  await requireAuth()
  return await prisma.truck.findUnique({
    where: { id: truckId },
    include: {
      photos: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      wheelPositions: {
        include: {
          currentTire: true,
        },
        orderBy: [{ axleNumber: 'asc' }, { positionCode: 'asc' }],
      },
      shipments: {
        include: { customer: true },
        orderBy: { date: 'desc' },
        take: 20,
      },
      tripContracts: {
        include: { legs: true, customer: true },
        orderBy: { createdAt: 'desc' },
      },
      maintenances: {
        orderBy: { date: 'desc' },
        take: 20,
      },
      sparepartUsages: {
        include: { sparepart: true },
        orderBy: { date: 'desc' },
        take: 20,
      },
      fuelLogs: {
        orderBy: { date: 'desc' },
        take: 20,
      },
      maintenanceSchedules: true,
    },
  })
}

export async function getTruckHealthScore2Action(truckId: string) {
  await requireAuth()

  const truck = await prisma.truck.findUnique({
    where: { id: truckId },
    include: {
      wheelPositions: { include: { currentTire: true } },
      documents: true,
      maintenances: true,
      maintenanceSchedules: true,
      fuelLogs: true,
      shipments: true,
    },
  })

  if (!truck) return { status: 'NOT_FOUND', score: null, breakdown: null }

  const installedTires = truck.wheelPositions
    .map((wp) => wp.currentTire)
    .filter((t): t is NonNullable<typeof t> => t !== null)

  const hasData =
    installedTires.length > 0 ||
    truck.documents.length > 0 ||
    truck.maintenances.length > 0 ||
    truck.fuelLogs.length > 0 ||
    truck.totalKm > 0

  if (!hasData) {
    return {
      status: 'NOT_ENOUGH_DATA',
      score: null,
      label: 'Not enough data',
      breakdown: null,
    }
  }

  // 1. Tire Health (0-100)
  let tireScore = 100
  if (installedTires.length > 0) {
    const totalPerc = installedTires.reduce((acc, t) => {
      const perc = t.expectedLifetimeKm > 0 ? (t.remainingLifetimeKm / t.expectedLifetimeKm) * 100 : 100
      return acc + Math.max(0, Math.min(100, perc))
    }, 0)
    tireScore = Math.round(totalPerc / installedTires.length)
  }

  // 2. Maintenance Status (0-100)
  let maintenanceScore = 90
  if (truck.maintenanceSchedules.length > 0) {
    let overdueCount = 0
    for (const sched of truck.maintenanceSchedules) {
      if (sched.intervalKm && sched.lastServiceKm !== null) {
        if (sched.lastServiceKm + sched.intervalKm < truck.totalKm) overdueCount++
      }
    }
    maintenanceScore = Math.max(0, 100 - overdueCount * 25)
  }

  // 3. Fuel Efficiency Score (0-100)
  let fuelScore = 85
  if (truck.fuelLogs.length > 1) {
    fuelScore = 90
  }

  // 4. Document Validity (0-100)
  let docScore = 100
  if (truck.documents.length > 0) {
    const now = new Date()
    const validDocs = truck.documents.filter((d) => !d.expiryDate || d.expiryDate > now).length
    docScore = Math.round((validDocs / truck.documents.length) * 100)
  }

  // 5. Odometer Consistency (0-100)
  let odoScore = 100
  const daysSinceUpdate = Math.ceil((Date.now() - truck.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceUpdate > 14) odoScore = 70
  if (daysSinceUpdate > 30) odoScore = 50

  // 6. Overall Weighted Average
  const overall = Math.round(
    tireScore * 0.25 + maintenanceScore * 0.25 + fuelScore * 0.2 + docScore * 0.15 + odoScore * 0.15
  )

  let label: 'EXCELLENT' | 'GOOD' | 'NEEDS ATTENTION' | 'CRITICAL' = 'EXCELLENT'
  if (overall >= 90) label = 'EXCELLENT'
  else if (overall >= 75) label = 'GOOD'
  else if (overall >= 60) label = 'NEEDS ATTENTION'
  else label = 'CRITICAL'

  return {
    status: 'CALCULATED',
    score: overall,
    label,
    breakdown: {
      tireHealth: tireScore,
      maintenanceStatus: maintenanceScore,
      fuelEfficiency: fuelScore,
      documentValidity: docScore,
      odometerConsistency: odoScore,
    },
  }
}

export async function getTruckDigitalLogbookAction(truckId: string) {
  await requireAuth()

  const [shipments, fuelLogs, tireMovements, maintenances, odoAdjustments, documents] = await Promise.all([
    prisma.shipment.findMany({
      where: { truckId },
      include: { customer: true },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.fuelLog.findMany({
      where: { truckId },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.tireMovementLog.findMany({
      where: {
        tire: { installations: { some: { truckId } } },
      },
      include: { tire: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.maintenance.findMany({
      where: { truckId },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.odometerAdjustment.findMany({
      where: { truckId },
      include: { adjustedBy: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.truckDocument.findMany({
      where: { truckId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ])

  const events: Array<{
    id: string
    type: 'SHIPMENT' | 'FUEL' | 'TIRE' | 'MAINTENANCE' | 'ODOMETER' | 'DOCUMENT'
    title: string
    description: string
    date: Date
    link: string
    metadata?: any
  }> = []

  for (const s of shipments) {
    events.push({
      id: `shp-${s.id}`,
      type: 'SHIPMENT',
      title: `Surat Jalan ${s.shipmentNumber}`,
      description: `Pengiriman ke ${s.customer.name} (${s.origin} -> ${s.destination}) - Jarak: ${s.totalKm} KM`,
      date: s.date,
      link: `/shipments`,
      metadata: { totalKm: s.totalKm, revenue: s.revenue ? Number(s.revenue) : null },
    })
  }

  for (const f of fuelLogs) {
    events.push({
      id: `fuel-${f.id}`,
      type: 'FUEL',
      title: `Pengisian BBM (${f.liter} Liters)`,
      description: `SPBU: ${f.gasStation || 'Umum'} - Refuel pada Odometer ${f.kmAtRefuel} KM`,
      date: f.date,
      link: `/fuel`,
      metadata: { totalCost: f.totalCost ? Number(f.totalCost) : null },
    })
  }

  for (const tm of tireMovements) {
    events.push({
      id: `tm-${tm.id}`,
      type: 'TIRE',
      title: `Pergerakan Ban: ${tm.tire.tireCode} (${tm.action})`,
      description: `Posisi: ${tm.fromPosCode || 'Gudang'} -> ${tm.toPosCode || 'Gudang'} (KM: ${tm.kmAtMovement})`,
      date: tm.createdAt,
      link: `/tires/${tm.tireId}`,
    })
  }

  for (const m of maintenances) {
    events.push({
      id: `mnt-${m.id}`,
      type: 'MAINTENANCE',
      title: `Maintenance: ${m.description}`,
      description: `Jenis: ${m.maintenanceType} - Bengkel: ${m.workshop || 'Internal'} (KM: ${m.kmAtMaintenance})`,
      date: m.date,
      link: `/maintenance`,
      metadata: { totalCost: m.totalCost ? Number(m.totalCost) : null },
    })
  }

  for (const o of odoAdjustments) {
    events.push({
      id: `odo-${o.id}`,
      type: 'ODOMETER',
      title: `Penyesuaian Odometer`,
      description: `Perubahan KM: ${o.previousKm} -> ${o.newKm} KM (${o.reason})`,
      date: o.createdAt,
      link: `/trucks/${truckId}`,
    })
  }

  for (const d of documents) {
    events.push({
      id: `doc-${d.id}`,
      type: 'DOCUMENT',
      title: `Dokumen: ${d.docName} (${d.docType})`,
      description: `Kedaluwarsa: ${d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('id-ID') : 'Tanpa Expire'}`,
      date: d.createdAt,
      link: `/trucks/${truckId}`,
    })
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime())

  return events
}

