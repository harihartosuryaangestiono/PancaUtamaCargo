'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath as nextRevalidate } from 'next/cache'
import { Prisma, MaintenanceType, TransactionType, PaymentMethod } from '@prisma/client'

export async function createMaintenanceAction(input: {
  date: string
  truckId: string
  kmAtMaintenance: number
  maintenanceType: MaintenanceType
  description: string
  laborCost?: number
  sparepartCost?: number
  otherCost?: number
  workshop?: string
  workshopPhone?: string
  workshopAddress?: string
  notes?: string
  attachmentUrl?: string
}) {
  const user = await requireOwner()

  if (!input.truckId || !input.description) {
    return { error: 'Truck dan Deskripsi maintenance wajib diisi.' }
  }

  const laborNum = input.laborCost !== undefined && input.laborCost !== null && !isNaN(Number(input.laborCost)) ? Number(input.laborCost) : null
  const spareNum = input.sparepartCost !== undefined && input.sparepartCost !== null && !isNaN(Number(input.sparepartCost)) ? Number(input.sparepartCost) : null
  const otherNum = input.otherCost !== undefined && input.otherCost !== null && !isNaN(Number(input.otherCost)) ? Number(input.otherCost) : null

  let totalCostNum: number | null = null
  if (laborNum !== null || spareNum !== null || otherNum !== null) {
    totalCostNum = (laborNum ?? 0) + (spareNum ?? 0) + (otherNum ?? 0)
  }

  const maintenanceNumber = `MNT-${Date.now().toString().slice(-6)}`

  const result = await prisma.$transaction(async (tx) => {
    const maintenance = await tx.maintenance.create({
      data: {
        maintenanceNumber,
        date: new Date(input.date || Date.now()),
        truckId: input.truckId,
        kmAtMaintenance: Number(input.kmAtMaintenance || 0),
        maintenanceType: input.maintenanceType || MaintenanceType.ROUTINE_SERVICE,
        description: input.description,
        laborCost: laborNum !== null ? new Prisma.Decimal(laborNum) : null,
        sparepartCost: spareNum !== null ? new Prisma.Decimal(spareNum) : null,
        otherCost: otherNum !== null ? new Prisma.Decimal(otherNum) : null,
        totalCost: totalCostNum !== null ? new Prisma.Decimal(totalCostNum) : null,
        workshop: input.workshop || null,
        workshopPhone: input.workshopPhone || null,
        workshopAddress: input.workshopAddress || null,
        notes: input.notes || null,
        attachmentUrl: input.attachmentUrl || null,
        createdById: user.userId,
      },
    })

    // Automatically post EXPENSE Financial Transaction if total cost is recorded and > 0
    if (totalCostNum !== null && totalCostNum > 0) {
      const expCat = await tx.expenseCategory.findFirst({ where: { name: 'Maintenance & Perbaikan' } })
      await tx.financialTransaction.create({
        data: {
          transactionNumber: `TRX-EXP-${Date.now().toString().slice(-6)}`,
          type: TransactionType.EXPENSE,
          date: maintenance.date,
          expenseCategoryId: expCat?.id || null,
          description: `Biaya Perbaikan/Service Truck (${input.description})`,
          maintenanceId: maintenance.id,
          amount: new Prisma.Decimal(totalCostNum),
          paymentMethod: PaymentMethod.CASH,
          createdById: user.userId,
        },
      })
    }

    return maintenance
  })

  await createAuditLog({
    action: 'CREATE_MAINTENANCE',
    module: 'TRUCK',
    recordId: result.id,
    afterValue: result,
  })

  nextRevalidate('/maintenance')
  nextRevalidate('/trucks')
  return { success: true, maintenance: result }
}

export async function updateMaintenanceAction(id: string, input: {
  date?: string
  kmAtMaintenance?: number
  maintenanceType?: MaintenanceType
  description?: string
  laborCost?: number
  sparepartCost?: number
  otherCost?: number
  workshop?: string
  workshopPhone?: string
  workshopAddress?: string
  notes?: string
  attachmentUrl?: string
}) {
  const user = await requireOwner()

  const existing = await prisma.maintenance.findUnique({ where: { id } })
  if (!existing) {
    return { error: 'Maintenance record tidak ditemukan.' }
  }

  const laborNum = input.laborCost !== undefined && input.laborCost !== null ? Number(input.laborCost) : (existing.laborCost ? Number(existing.laborCost) : null)
  const spareNum = input.sparepartCost !== undefined && input.sparepartCost !== null ? Number(input.sparepartCost) : (existing.sparepartCost ? Number(existing.sparepartCost) : null)
  const otherNum = input.otherCost !== undefined && input.otherCost !== null ? Number(input.otherCost) : (existing.otherCost ? Number(existing.otherCost) : null)

  let totalCostNum: number | null = null
  if (laborNum !== null || spareNum !== null || otherNum !== null) {
    totalCostNum = (laborNum ?? 0) + (spareNum ?? 0) + (otherNum ?? 0)
  }

  const updated = await prisma.maintenance.update({
    where: { id },
    data: {
      date: input.date ? new Date(input.date) : undefined,
      kmAtMaintenance: input.kmAtMaintenance !== undefined ? Number(input.kmAtMaintenance) : undefined,
      maintenanceType: input.maintenanceType || undefined,
      description: input.description || undefined,
      laborCost: laborNum !== null ? new Prisma.Decimal(laborNum) : null,
      sparepartCost: spareNum !== null ? new Prisma.Decimal(spareNum) : null,
      otherCost: otherNum !== null ? new Prisma.Decimal(otherNum) : null,
      totalCost: totalCostNum !== null ? new Prisma.Decimal(totalCostNum) : null,
      workshop: input.workshop !== undefined ? input.workshop : undefined,
      workshopPhone: input.workshopPhone !== undefined ? input.workshopPhone : undefined,
      workshopAddress: input.workshopAddress !== undefined ? input.workshopAddress : undefined,
      notes: input.notes !== undefined ? input.notes : undefined,
      attachmentUrl: input.attachmentUrl !== undefined ? input.attachmentUrl : undefined,
    },
  })

  // Update associated financial transaction if total cost changed
  if (totalCostNum !== null) {
    await prisma.financialTransaction.updateMany({
      where: { maintenanceId: id },
      data: { amount: new Prisma.Decimal(totalCostNum) },
    })
  }

  await createAuditLog({
    action: 'UPDATE_MAINTENANCE',
    module: 'TRUCK',
    recordId: id,
    beforeValue: existing,
    afterValue: updated,
  })

  nextRevalidate('/maintenance')
  nextRevalidate('/trucks')
  return { success: true, maintenance: updated }
}

export async function deleteMaintenanceAction(id: string) {
  const user = await requireOwner()

  const existing = await prisma.maintenance.findUnique({ where: { id } })
  if (!existing) {
    return { error: 'Maintenance record tidak ditemukan.' }
  }

  await prisma.$transaction(async (tx) => {
    // Delete associated financial transaction first
    await tx.financialTransaction.deleteMany({ where: { maintenanceId: id } })
    await tx.maintenance.delete({ where: { id } })
  })

  await createAuditLog({
    action: 'DELETE_MAINTENANCE',
    module: 'TRUCK',
    recordId: id,
    beforeValue: existing,
  })

  nextRevalidate('/maintenance')
  nextRevalidate('/trucks')
  return { success: true }
}

export async function getMaintenancesAction(truckId?: string) {
  await requireAuth()
  return await prisma.maintenance.findMany({
    where: truckId ? { truckId } : undefined,
    include: {
      truck: true,
      createdBy: true,
    },
    orderBy: { date: 'desc' },
  })
}
