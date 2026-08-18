'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export interface RecordAdvanceInput {
  contractId: string
  tripLegId?: string
  driverName: string
  amount: number
  notes?: string
}

export async function recordDriverAdvanceAction(input: RecordAdvanceInput) {
  const session = await requireOwner()

  if (!input.contractId || !input.amount || input.amount <= 0) {
    return { error: 'Jumlah uang jalan (advance) harus lebih besar dari 0.' }
  }

  const advance = await prisma.driverAdvance.create({
    data: {
      contractId: input.contractId,
      tripLegId: input.tripLegId || null,
      driverName: input.driverName,
      amount: input.amount,
      status: 'GIVEN',
      notes: input.notes || 'Uang Jalan Perjalanan',
      createdById: session.userId,
    },
  })

  await createAuditLog({
    action: 'CREATE_DRIVER_ADVANCE',
    module: 'CONTRACT',
    recordId: advance.id,
    afterValue: advance,
  })

  revalidatePath(`/contracts/${input.contractId}`)
  revalidatePath('/contracts')
  return { success: true, advance }
}

export interface SettleDriverInput {
  contractId: string
  driverName: string
  driverShare: number
  driverToll: number
  advanceAmount: number
  resolution: 'RETURN_TO_COMPANY' | 'ADDITIONAL_PAYMENT' | 'OFFSET_TO_NEXT_TRIP' | 'OTHER'
  notes?: string
}

export async function settleDriverAction(input: SettleDriverInput) {
  const session = await requireOwner()

  if (!input.contractId) {
    return { error: 'Contract ID wajib diisi.' }
  }

  const diff = input.driverShare - input.advanceAmount
  const finalAmount = input.driverShare

  const settlement = await prisma.$transaction(async (tx) => {
    const s = await tx.driverSettlement.create({
      data: {
        contractId: input.contractId,
        driverName: input.driverName,
        driverShare: input.driverShare,
        driverToll: input.driverToll,
        advanceAmount: input.advanceAmount,
        finalDriverAmount: finalAmount,
        settlementDifference: diff,
        differenceResolution: input.resolution,
        status: 'SETTLED',
        notes: input.notes || `Settlement Totalan Supir Kontrak`,
      },
    })

    await tx.driverAdvance.updateMany({
      where: { contractId: input.contractId },
      data: { status: 'SETTLED' },
    })

    return s
  })

  await createAuditLog({
    action: 'CREATE_DRIVER_SETTLEMENT',
    module: 'CONTRACT',
    recordId: settlement.id,
    afterValue: settlement,
  })

  revalidatePath(`/contracts/${input.contractId}`)
  revalidatePath('/contracts')
  return { success: true, settlement }
}
