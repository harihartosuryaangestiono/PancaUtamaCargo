'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export interface AdjustOdometerInput {
  truckId: string
  newKm: number
  reason: string
}

export async function adjustOdometerAction(input: AdjustOdometerInput) {
  const session = await requireOwner()

  if (!input.truckId || isNaN(input.newKm) || input.newKm < 0 || !input.reason) {
    return { error: 'Truck ID, Angka KM Odometer baru, dan Alasan penyesuaian wajib diisi.' }
  }

  const truck = await prisma.truck.findUnique({ where: { id: input.truckId } })
  if (!truck) return { error: 'Truck tidak ditemukan.' }

  const previousKm = truck.totalKm
  const newKm = Number(input.newKm)

  const adjustment = await prisma.$transaction(async (tx: any) => {
    const adj = await tx.odometerAdjustment.create({
      data: {
        truckId: input.truckId,
        previousKm,
        newKm,
        reason: input.reason,
        adjustedById: session.userId,
      },
    })

    await tx.truck.update({
      where: { id: input.truckId },
      data: { totalKm: newKm },
    })

    return adj
  })

  await createAuditLog({
    action: 'ODOMETER_ADJUSTMENT',
    module: 'TRUCK',
    recordId: truck.id,
    beforeValue: { totalKm: previousKm },
    afterValue: { totalKm: newKm, reason: input.reason },
  })

  revalidatePath(`/trucks/${input.truckId}`)
  revalidatePath('/dashboard')
  return { success: true, adjustment }
}

export async function getOdometerHistoryAction(truckId: string) {
  await requireAuth()

  const shipments = await prisma.shipment.findMany({
    where: { truckId, status: 'COMPLETED' },
    orderBy: { date: 'desc' },
  })

  const maintenances = await prisma.maintenance.findMany({
    where: { truckId },
    orderBy: { date: 'desc' },
  })

  const adjustments = await prisma.odometerAdjustment.findMany({
    where: { truckId },
    include: { adjustedBy: true },
    orderBy: { createdAt: 'desc' },
  })

  const events: Array<{
    id: string
    date: Date
    source: 'Shipment' | 'Maintenance' | 'Adjustment'
    km: number
    change: number | null
    description: string
    recordId: string
  }> = []

  for (const s of shipments) {
    events.push({
      id: `shp-${s.id}`,
      date: s.date,
      source: 'Shipment',
      km: s.endKm,
      change: s.totalKm,
      description: `Surat Jalan ${s.shipmentNumber}: ${s.origin} -> ${s.destination}`,
      recordId: s.id,
    })
  }

  for (const m of maintenances) {
    events.push({
      id: `maint-${m.id}`,
      date: m.date,
      source: 'Maintenance',
      km: m.kmAtMaintenance,
      change: null,
      description: `Maintenance (${m.maintenanceType}): ${m.description}`,
      recordId: m.id,
    })
  }

  for (const a of adjustments) {
    events.push({
      id: `adj-${a.id}`,
      date: a.createdAt,
      source: 'Adjustment',
      km: a.newKm,
      change: a.newKm - a.previousKm,
      description: `Penyesuaian Odometer: ${a.reason} (oleh ${a.adjustedBy.name})`,
      recordId: a.id,
    })
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime())
  return events
}
