'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth, requireFinanceOrOwner } from '@/lib/session'
import { getCompanyTireSettings, recalculateTireKm } from '@/lib/services/tireService'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export interface CreateTireInput {
  tireCode: string
  brand: string
  model: string
  size: string
  serialNumber: string
  purchaseDate: string
  purchasePrice?: number
  initialKm?: number
  expectedLifetimeKm?: number
  condition?: string
  notes?: string
}

export async function createTireAction(input: CreateTireInput) {
  await requireOwner()

  if (!input.tireCode || !input.brand || !input.serialNumber) {
    return { error: 'Kode Ban, Merk, dan Nomor Seri wajib diisi.' }
  }

  const existingSerial = await prisma.tire.findUnique({
    where: { serialNumber: input.serialNumber },
  })
  if (existingSerial) {
    return { error: `Nomor Seri "${input.serialNumber}" sudah terdaftar.` }
  }

  const settings = await getCompanyTireSettings()
  const expectedKm = input.expectedLifetimeKm
    ? Number(input.expectedLifetimeKm)
    : settings.defaultTireLifetimeKm

  const tire = await prisma.$transaction(async (tx) => {
    const created = await tx.tire.create({
      data: {
        tireCode: input.tireCode,
        brand: input.brand,
        model: input.model || 'Standard',
        size: input.size || '11.00-20',
        serialNumber: input.serialNumber,
        purchaseDate: new Date(input.purchaseDate || Date.now()),
        purchasePrice: input.purchasePrice ? Number(input.purchasePrice) : 0,
        initialKm: input.initialKm ? Number(input.initialKm) : null,
        currentKm: 0,
        expectedLifetimeKm: expectedKm,
        remainingLifetimeKm: expectedKm,
        status: 'NEW',
        condition: input.condition || 'NOT_INSPECTED',
        notes: input.notes || null,
      },
    })

    await tx.tireMovementLog.create({
      data: {
        tireId: created.id,
        action: 'PURCHASED',
        kmAtMovement: 0,
        reason: 'Pembelian Ban Baru',
      },
    })

    return created
  })

  await createAuditLog({
    action: 'CREATE_TIRE',
    module: 'TIRE',
    recordId: tire.id,
    afterValue: tire,
  })

  revalidatePath('/tires')
  return { success: true, tire }
}

export async function installTireAction(params: {
  tireId: string
  truckId: string
  wheelPositionId: string
  installedKm: number
  notes?: string
}) {
  await requireFinanceOrOwner()

  const { tireId, truckId, wheelPositionId, installedKm, notes } = params

  return await prisma.$transaction(async (tx) => {
    const position = await tx.truckWheelPosition.findUnique({
      where: { id: wheelPositionId },
      include: { currentTire: true },
    })

    if (!position) {
      throw new Error('Posisi roda tidak ditemukan.')
    }
    if (position.currentTireId) {
      throw new Error(`Posisi ${position.positionCode} sudah terpasang ban lain (${position.currentTire?.serialNumber}). Harap lepaskan dulu.`)
    }

    const tire = await tx.tire.findUnique({
      where: { id: tireId },
      include: { currentPosition: true },
    })

    if (!tire) {
      throw new Error('Ban tidak ditemukan.')
    }
    if (tire.currentPosition) {
      throw new Error(`Ban ${tire.serialNumber} saat ini masih terpasang pada posisi ${tire.currentPosition.positionCode}.`)
    }

    await tx.tireInstallation.create({
      data: {
        tireId,
        truckId,
        wheelPositionId,
        installedAtDate: new Date(),
        installedKm: Number(installedKm),
        notes: notes || null,
      },
    })

    await tx.truckWheelPosition.update({
      where: { id: wheelPositionId },
      data: { currentTireId: tireId },
    })

    await tx.tireMovementLog.create({
      data: {
        tireId,
        action: 'INSTALLED',
        toPosCode: position.positionCode,
        kmAtMovement: Number(installedKm),
        reason: notes || `Pemasangan pada posisi ${position.positionCode}`,
      },
    })

    await tx.tire.update({
      where: { id: tireId },
      data: { status: 'ACTIVE' },
    })

    await recalculateTireKm(tireId, tx)

    await createAuditLog({
      action: 'INSTALL_TIRE',
      module: 'TIRE',
      recordId: tireId,
      afterValue: { wheelPositionId, installedKm },
    })

    revalidatePath('/trucks')
    revalidatePath(`/trucks/${truckId}`)
    revalidatePath('/tires')
    revalidatePath(`/tires/${tireId}`)
    return { success: true }
  })
}

export async function rotateTireAction(params: {
  tireId: string
  newWheelPositionId: string
  kmAtRotation: number
  reason?: string
}) {
  await requireOwner()

  const { tireId, newWheelPositionId, kmAtRotation, reason } = params

  return await prisma.$transaction(async (tx) => {
    const tire = await tx.tire.findUnique({
      where: { id: tireId },
      include: {
        currentPosition: true,
        installations: {
          where: { removedKm: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!tire || !tire.currentPosition) {
      throw new Error('Ban tidak sedang terpasang pada posisi manapun.')
    }

    const currentPos = tire.currentPosition
    const activeInst = tire.installations[0]

    const targetPos = await tx.truckWheelPosition.findUnique({
      where: { id: newWheelPositionId },
      include: { currentTire: true },
    })

    if (!targetPos) {
      throw new Error('Posisi tujuan tidak ditemukan.')
    }
    if (targetPos.currentTireId) {
      throw new Error(`Posisi tujuan ${targetPos.positionCode} sudah terisi.`)
    }

    if (activeInst) {
      const periodKm = Math.max(0, Number(kmAtRotation) - activeInst.installedKm)
      await tx.tireInstallation.update({
        where: { id: activeInst.id },
        data: {
          removedAtDate: new Date(),
          removedKm: Number(kmAtRotation),
          actualUsedKm: periodKm,
          removalReason: reason || 'Rotasi Ban',
        },
      })
    }

    await tx.truckWheelPosition.update({
      where: { id: currentPos.id },
      data: { currentTireId: null },
    })

    await tx.tireInstallation.create({
      data: {
        tireId,
        truckId: targetPos.truckId,
        wheelPositionId: targetPos.id,
        installedAtDate: new Date(),
        installedKm: Number(kmAtRotation),
        notes: reason || `Rotasi dari ${currentPos.positionCode} ke ${targetPos.positionCode}`,
      },
    })

    await tx.truckWheelPosition.update({
      where: { id: targetPos.id },
      data: { currentTireId: tireId },
    })

    await tx.tireMovementLog.create({
      data: {
        tireId,
        action: 'ROTATED',
        fromPosCode: currentPos.positionCode,
        toPosCode: targetPos.positionCode,
        kmAtMovement: Number(kmAtRotation),
        reason: reason || `Rotasi ${currentPos.positionCode} -> ${targetPos.positionCode}`,
      },
    })

    await recalculateTireKm(tireId, tx)

    await createAuditLog({
      action: 'ROTATE_TIRE',
      module: 'TIRE',
      recordId: tireId,
      afterValue: { fromPos: currentPos.positionCode, toPos: targetPos.positionCode, kmAtRotation },
    })

    revalidatePath('/trucks')
    revalidatePath('/tires')
    return { success: true }
  })
}

export async function removeTireAction(params: {
  tireId: string
  removedKm: number
  reason?: string
}) {
  await requireOwner()

  const { tireId, removedKm, reason } = params

  return await prisma.$transaction(async (tx) => {
    const tire = await tx.tire.findUnique({
      where: { id: tireId },
      include: {
        currentPosition: true,
        installations: {
          where: { removedKm: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!tire || !tire.currentPosition) {
      throw new Error('Ban tidak sedang terpasang pada posisi manapun.')
    }

    const currentPos = tire.currentPosition
    const activeInst = tire.installations[0]

    if (activeInst) {
      const periodKm = Math.max(0, Number(removedKm) - activeInst.installedKm)
      let costPerKm: number | null = null

      if (tire.purchasePrice && periodKm > 0) {
        costPerKm = Number(tire.purchasePrice) / periodKm
      }

      await tx.tireInstallation.update({
        where: { id: activeInst.id },
        data: {
          removedAtDate: new Date(),
          removedKm: Number(removedKm),
          actualUsedKm: periodKm,
          costPerKm: costPerKm,
          removalReason: reason || 'Pelepasan manual',
        },
      })
    }

    await tx.truckWheelPosition.update({
      where: { id: currentPos.id },
      data: { currentTireId: null },
    })

    await tx.tireMovementLog.create({
      data: {
        tireId,
        action: 'REMOVED',
        fromPosCode: currentPos.positionCode,
        kmAtMovement: Number(removedKm),
        reason: reason || 'Pelepasan ban',
      },
    })

    await recalculateTireKm(tireId, tx)

    await createAuditLog({
      action: 'REMOVE_TIRE',
      module: 'TIRE',
      recordId: tireId,
      afterValue: { removedKm, reason },
    })

    revalidatePath('/trucks')
    revalidatePath('/tires')
    return { success: true }
  })
}

export async function replaceTireAction(params: {
  oldTireId: string
  newTireId: string
  kmAtReplacement: number
  reason?: string
}) {
  await requireOwner()

  const { oldTireId, newTireId, kmAtReplacement, reason } = params

  return await prisma.$transaction(async (tx) => {
    const oldTire = await tx.tire.findUnique({
      where: { id: oldTireId },
      include: {
        currentPosition: true,
        installations: {
          where: { removedKm: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!oldTire || !oldTire.currentPosition) {
      throw new Error('Ban lama tidak sedang terpasang pada truck.')
    }

    const position = oldTire.currentPosition
    const activeInst = oldTire.installations[0]

    if (activeInst) {
      const periodKm = Math.max(0, Number(kmAtReplacement) - activeInst.installedKm)
      await tx.tireInstallation.update({
        where: { id: activeInst.id },
        data: {
          removedAtDate: new Date(),
          removedKm: Number(kmAtReplacement),
          actualUsedKm: periodKm,
          removalReason: reason || 'Replacement Due / Penggantian Ban Haus',
        },
      })
    }

    await tx.truckWheelPosition.update({
      where: { id: position.id },
      data: { currentTireId: null },
    })

    await tx.tire.update({
      where: { id: oldTireId },
      data: { status: 'REPLACED' },
    })

    await tx.tireMovementLog.create({
      data: {
        tireId: oldTireId,
        action: 'REPLACED',
        fromPosCode: position.positionCode,
        kmAtMovement: Number(kmAtReplacement),
        reason: reason || 'Replacement Due / Ban Diganti',
      },
    })

    await tx.tireInstallation.create({
      data: {
        tireId: newTireId,
        truckId: position.truckId,
        wheelPositionId: position.id,
        installedAtDate: new Date(),
        installedKm: Number(kmAtReplacement),
        notes: `Penggantian ban dari ${oldTire.tireCode}`,
      },
    })

    await tx.truckWheelPosition.update({
      where: { id: position.id },
      data: { currentTireId: newTireId },
    })

    await tx.tire.update({
      where: { id: newTireId },
      data: { status: 'ACTIVE' },
    })

    await tx.tireMovementLog.create({
      data: {
        tireId: newTireId,
        action: 'INSTALLED',
        toPosCode: position.positionCode,
        kmAtMovement: Number(kmAtReplacement),
        reason: `Penggantian dari ban ${oldTire.tireCode}`,
      },
    })

    await recalculateTireKm(oldTireId, tx)
    await recalculateTireKm(newTireId, tx)

    await createAuditLog({
      action: 'REPLACE_TIRE',
      module: 'TIRE',
      recordId: oldTireId,
      afterValue: { oldTireId, newTireId, kmAtReplacement },
    })

    revalidatePath('/trucks')
    revalidatePath('/tires')
    return { success: true }
  })
}

export async function getTiresAction() {
  await requireAuth()
  return await prisma.tire.findMany({
    include: {
      currentPosition: {
        include: { truck: true },
      },
      installations: {
        include: { truck: true, wheelPosition: true },
        orderBy: { installedAtDate: 'desc' },
      },
      movements: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTireByIdAction(tireId: string) {
  await requireAuth()
  return await prisma.tire.findUnique({
    where: { id: tireId },
    include: {
      currentPosition: {
        include: { truck: true },
      },
      installations: {
        include: { truck: true, wheelPosition: true },
        orderBy: { installedAtDate: 'desc' },
      },
      movements: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}
