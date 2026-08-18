'use server'

import { prisma } from '@/lib/prisma'
import { requireFinanceOrOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export async function createFinancialTransactionAction(input: {
  type: 'INCOME' | 'EXPENSE'
  date: string
  categoryId: string
  description: string
  amount: number
  customerId?: string
  purchaseSource?: string
  paymentMethod?: string
  referenceNumber?: string
  notes?: string
}) {
  const user = await requireFinanceOrOwner()

  const amount = Number(input.amount)
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Jumlah nominal transaksi harus bernilai positif.' }
  }

  if (!input.description || !input.categoryId) {
    return { error: 'Deskripsi dan Kategori wajib diisi.' }
  }

  const transactionNumber = `TRX-${input.type === 'INCOME' ? 'INC' : 'EXP'}-${Date.now().toString().slice(-6)}`

  // Validate category type
  if (input.type === 'INCOME') {
    const incCat = await prisma.incomeCategory.findUnique({ where: { id: input.categoryId } })
    if (!incCat) return { error: 'Kategori Pemasukan tidak valid.' }
  } else {
    const expCat = await prisma.expenseCategory.findUnique({ where: { id: input.categoryId } })
    if (!expCat) return { error: 'Kategori Pengeluaran tidak valid.' }
  }

  const trx = await prisma.financialTransaction.create({
    data: {
      transactionNumber,
      type: input.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      date: new Date(input.date || Date.now()),
      incomeCategoryId: input.type === 'INCOME' ? input.categoryId : null,
      expenseCategoryId: input.type === 'EXPENSE' ? input.categoryId : null,
      description: input.description,
      amount: amount,
      customerId: input.customerId || null,
      purchaseSource: input.purchaseSource || null,
      paymentMethod: (input.paymentMethod as any) || 'TRANSFER',
      referenceNumber: input.referenceNumber || null,
      notes: input.notes || null,
      createdById: user.userId,
    },
  })

  await createAuditLog({
    action: `CREATE_${input.type}_TRANSACTION`,
    module: 'FINANCE',
    recordId: trx.id,
    afterValue: trx,
  })

  revalidatePath('/financials')
  revalidatePath('/dashboard')
  return { success: true, transaction: trx }
}

export async function getFinancialsAction() {
  await requireAuth()
  return await prisma.financialTransaction.findMany({
    include: {
      incomeCategory: true,
      expenseCategory: true,
      customer: true,
      createdBy: true,
    },
    orderBy: { date: 'desc' },
  })
}

export async function getPnLReportAction(startDate?: string, endDate?: string) {
  await requireAuth()

  const whereClause: any = {}
  if (startDate || endDate) {
    whereClause.date = {}
    if (startDate) whereClause.date.gte = new Date(startDate)
    if (endDate) whereClause.date.lte = new Date(endDate)
  }

  const transactions = await prisma.financialTransaction.findMany({
    where: whereClause,
    include: {
      incomeCategory: true,
      expenseCategory: true,
    },
  })

  let totalIncome = 0
  let totalExpense = 0

  const incomeByCategory: Record<string, number> = {}
  const expenseByCategory: Record<string, number> = {}

  for (const t of transactions) {
    const amt = Number(t.amount)
    if (t.type === 'INCOME') {
      totalIncome += amt
      const catName = t.incomeCategory?.name || 'Uncategorized'
      incomeByCategory[catName] = (incomeByCategory[catName] || 0) + amt
    } else {
      totalExpense += amt
      const catName = t.expenseCategory?.name || 'Uncategorized'
      expenseByCategory[catName] = (expenseByCategory[catName] || 0) + amt
    }
  }

  const netProfit = totalIncome - totalExpense

  return {
    totalIncome,
    totalExpense,
    netProfit,
    incomeByCategory,
    expenseByCategory,
    transactionCount: transactions.length,
  }
}
