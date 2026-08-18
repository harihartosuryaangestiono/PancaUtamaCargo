'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireFinanceOrOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

export async function createSparepartAction(input: {
  partNumber: string
  name: string
  categoryId: string
  brand?: string
  unit?: string
  minStock?: number
  location?: string
  notes?: string
}) {
  await requireOwner()

  if (!input.partNumber || !input.name || !input.categoryId) {
    return { error: 'Part Number, Nama Sparepart, dan Kategori wajib diisi.' }
  }

  const existingPart = await prisma.sparepart.findUnique({
    where: { partNumber: input.partNumber },
  })
  if (existingPart) {
    return { error: `Part Number "${input.partNumber}" sudah terdaftar.` }
  }

  const sparepart = await prisma.sparepart.create({
    data: {
      partNumber: input.partNumber,
      name: input.name,
      categoryId: input.categoryId,
      brand: input.brand || null,
      unit: input.unit || 'Pcs',
      minStock: input.minStock ? Number(input.minStock) : 0,
      currentStock: 0, // Stock starts at 0 until user performs purchase transaction
      location: input.location || null,
      notes: input.notes || null,
    },
  })

  await createAuditLog({
    action: 'CREATE_SPAREPART',
    module: 'SPAREPART',
    recordId: sparepart.id,
    afterValue: sparepart,
  })

  revalidatePath('/spareparts')
  return { success: true, sparepart }
}

export async function purchaseSparepartAction(input: {
  purchaseSource?: string
  invoiceNumber: string
  date: string
  sparepartId: string
  quantity: number
  unitPrice: number
  discount?: number
  tax?: number
  notes?: string
}) {
  // Finance or Owner can purchase spareparts
  const user = await requireFinanceOrOwner()

  const quantity = Number(input.quantity)
  const unitPrice = Number(input.unitPrice)
  if (quantity <= 0 || unitPrice < 0) {
    return { error: 'Jumlah kuantitas dan harga satuan harus bernilai positif.' }
  }

  const discount = Number(input.discount || 0)
  const tax = Number(input.tax || 0)
  const subtotal = quantity * unitPrice
  const totalAmount = subtotal - discount + tax

  const purchaseNumber = `PUR-${Date.now().toString().slice(-6)}`

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Purchase record
    const purchase = await tx.sparepartPurchase.create({
      data: {
        purchaseNumber,
        date: new Date(input.date || Date.now()),
        purchaseSource: input.purchaseSource || null,
        invoiceNumber: input.invoiceNumber,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        tax: new Prisma.Decimal(tax),
        totalAmount: new Prisma.Decimal(totalAmount),
        paymentMethod: 'TRANSFER',
        notes: input.notes || null,
        createdById: user.userId,
        items: {
          create: {
            sparepartId: input.sparepartId,
            quantity,
            unitPrice: new Prisma.Decimal(unitPrice),
            discount: new Prisma.Decimal(discount),
            tax: new Prisma.Decimal(tax),
            subtotal: new Prisma.Decimal(subtotal),
          },
        },
      },
    })

    // 2. Update Sparepart Stock and Average Price
    const sparepart = await tx.sparepart.findUnique({ where: { id: input.sparepartId } })
    if (!sparepart) throw new Error('Sparepart tidak ditemukan.')

    const prevStock = sparepart.currentStock
    const newStock = prevStock + quantity

    // Recalculate average purchase price
    const currentAvg = sparepart.avgPurchasePrice ? Number(sparepart.avgPurchasePrice) : 0
    const newAvg = (prevStock * currentAvg + subtotal) / newStock

    await tx.sparepart.update({
      where: { id: input.sparepartId },
      data: {
        currentStock: newStock,
        lastPurchasePrice: new Prisma.Decimal(unitPrice),
        avgPurchasePrice: new Prisma.Decimal(newAvg),
      },
    })

    // 3. Log InventoryTransaction
    await tx.inventoryTransaction.create({
      data: {
        sparepartId: input.sparepartId,
        type: 'PURCHASE',
        quantity,
        previousStock: prevStock,
        newStock: newStock,
        unitPrice: new Prisma.Decimal(unitPrice),
        referenceType: 'PURCHASE',
        referenceId: purchase.id,
        reason: `Pembelian Nota ${input.invoiceNumber}`,
        createdById: user.userId,
      },
    })

    // 4. Post linked EXPENSE Financial Transaction
    const expCat = await tx.expenseCategory.findFirst({ where: { name: 'Pembelian Sparepart' } })
    await tx.financialTransaction.create({
      data: {
        transactionNumber: `TRX-EXP-${Date.now().toString().slice(-6)}`,
        type: 'EXPENSE',
        date: purchase.date,
        expenseCategoryId: expCat?.id || null,
        description: `Pembelian Sparepart Inv #${input.invoiceNumber}`,
        purchaseSource: input.purchaseSource || null,
        purchaseId: purchase.id,
        amount: new Prisma.Decimal(totalAmount),
        paymentMethod: 'TRANSFER',
        createdById: user.userId,
      },
    })

    return purchase
  })

  await createAuditLog({
    action: 'PURCHASE_SPAREPART',
    module: 'SPAREPART',
    recordId: result.id,
    afterValue: result,
  })

  revalidatePath('/spareparts')
  revalidatePath('/financials')
  return { success: true, purchase: result }
}

export async function useSparepartAction(input: {
  date: string
  truckId: string
  sparepartId: string
  quantity: number
  kmAtUsage?: number
  technician?: string
  notes?: string
}) {
  const user = await requireOwner()
  const quantity = Number(input.quantity)
  if (quantity <= 0) {
    return { error: 'Jumlah pemakaian harus lebih dari 0.' }
  }

  const usageNumber = `USG-${Date.now().toString().slice(-6)}`

  const result = await prisma.$transaction(async (tx) => {
    const sparepart = await tx.sparepart.findUnique({ where: { id: input.sparepartId } })
    if (!sparepart) throw new Error('Sparepart tidak ditemukan.')

    if (sparepart.currentStock < quantity) {
      throw new Error(`Stok sparepart "${sparepart.name}" tidak mencukupi (Stok saat ini: ${sparepart.currentStock}, Pemakaian: ${quantity}).`)
    }

    const prevStock = sparepart.currentStock
    const newStock = prevStock - quantity
    const unitCostNum = sparepart.avgPurchasePrice ? Number(sparepart.avgPurchasePrice) : 0
    const totalCostNum = quantity * unitCostNum

    // 1. Create SparepartUsage record
    const usage = await tx.sparepartUsage.create({
      data: {
        usageNumber,
        date: new Date(input.date || Date.now()),
        truckId: input.truckId,
        sparepartId: input.sparepartId,
        quantity,
        unitCost: new Prisma.Decimal(unitCostNum),
        totalCost: new Prisma.Decimal(totalCostNum),
        kmAtUsage: input.kmAtUsage ? Number(input.kmAtUsage) : null,
        technician: input.technician || null,
        notes: input.notes || null,
        createdById: user.userId,
      },
    })

    // 2. Decrement stock
    await tx.sparepart.update({
      where: { id: input.sparepartId },
      data: { currentStock: newStock },
    })

    // 3. Log InventoryTransaction
    await tx.inventoryTransaction.create({
      data: {
        sparepartId: input.sparepartId,
        type: 'USAGE',
        quantity,
        previousStock: prevStock,
        newStock: newStock,
        unitPrice: new Prisma.Decimal(unitCostNum),
        referenceType: 'USAGE',
        referenceId: usage.id,
        reason: `Pemakaian pada Truck`,
        createdById: user.userId,
      },
    })

    return usage
  })

  await createAuditLog({
    action: 'USAGE_SPAREPART',
    module: 'SPAREPART',
    recordId: result.id,
    afterValue: result,
  })

  revalidatePath('/spareparts')
  revalidatePath('/trucks')
  return { success: true, usage: result }
}

export async function getSparepartsAction() {
  await requireAuth()
  return await prisma.sparepart.findMany({
    include: {
      category: true,
      usages: { include: { truck: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getSparepartPurchasesAction() {
  await requireAuth()
  return await prisma.sparepartPurchase.findMany({
    include: {
      items: { include: { sparepart: true } },
    },
    orderBy: { date: 'desc' },
  })
}
