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

export interface GetFinancialsParams {
  sourceFilter?: string
  startDate?: string
  endDate?: string
}

export async function getFinancialsAction(params?: GetFinancialsParams) {
  await requireAuth()

  // 1. Primary FinancialTransaction records
  const mainTransactions = await prisma.financialTransaction.findMany({
    include: {
      incomeCategory: true,
      expenseCategory: true,
      customer: true,
      createdBy: true,
      maintenance: true,
      contract: true,
      bcaMutation: true,
    },
    orderBy: { date: 'desc' },
  })

  // Set of linked maintenance, contract, bca IDs to avoid duplicate counting
  const linkedMaintenanceIds = new Set(mainTransactions.map(t => t.maintenanceId).filter(Boolean))
  const linkedBcaMutationIds = new Set(mainTransactions.map(t => t.bcaMutation?.id).filter(Boolean))
  const linkedContractTrxIds = new Set(mainTransactions.map(t => t.contractId).filter(Boolean))

  const combinedList: any[] = []

  // Add Main Financial Transactions
  for (const t of mainTransactions) {
    let source = 'JURNAL'
    let sourceBadge = 'Jurnal Keuangan'
    if (t.maintenanceId) {
      source = 'MAINTENANCE'
      sourceBadge = 'Maintenance'
    } else if (t.contractId) {
      source = 'KONTRAK'
      sourceBadge = 'Kontrak Pelanggan'
    } else if (t.bcaMutation) {
      source = 'BANK_BCA'
      sourceBadge = 'Mutasi BCA'
    }

    combinedList.push({
      id: t.id,
      transactionNumber: t.transactionNumber,
      type: t.type,
      date: t.date,
      categoryName: t.type === 'INCOME' ? (t.incomeCategory?.name || 'Pemasukan') : (t.expenseCategory?.name || 'Pengeluaran'),
      description: t.description,
      amount: Number(t.amount),
      paymentMethod: t.paymentMethod,
      createdByName: t.createdBy?.name || 'Sistem',
      source,
      sourceBadge,
      raw: t,
    })
  }

  // 2. Add unlinked KasMutations (Buku Kas)
  const kasMutations = await prisma.kasMutation.findMany({
    orderBy: { createdAt: 'desc' },
  })

  for (const k of kasMutations) {
    const deb = Number(k.debit)
    const kre = Number(k.kredit)
    const dt = k.tanggal || new Date(k.createdAt)
    const type = k.jenis === 'Pemasukan' || kre > 0 ? 'INCOME' : 'EXPENSE'
    const amount = type === 'INCOME' ? kre : deb

    if (amount > 0) {
      combinedList.push({
        id: `kas-${k.id}`,
        transactionNumber: `KAS-${k.id.slice(-6).toUpperCase()}`,
        type,
        date: dt,
        categoryName: k.kategori || 'Buku Kas',
        description: k.keterangan || 'Mutasi Buku Kas',
        amount,
        paymentMethod: 'CASH',
        createdByName: 'Kas Spreadsheet',
        source: 'BUKU_KAS',
        sourceBadge: 'Buku Kas',
        raw: k,
      })
    }
  }

  // 3. Add unlinked BcaMutations (KlikBCA)
  const bcaMutations = await prisma.bcaMutation.findMany({
    where: { isPosted: false },
    orderBy: { createdAt: 'desc' },
  })

  for (const b of bcaMutations) {
    if (linkedBcaMutationIds.has(b.id)) continue
    const amt = Number(b.amount)
    const type = b.type === 'CR' ? 'INCOME' : 'EXPENSE'
    const dt = b.date || new Date(b.createdAt)

    if (amt > 0) {
      combinedList.push({
        id: `bca-${b.id}`,
        transactionNumber: `BCA-${b.branch || '0000'}-${b.id.slice(-4).toUpperCase()}`,
        type,
        date: dt,
        categoryName: type === 'INCOME' ? 'Pemasukan Bank BCA' : 'Pengeluaran Bank BCA',
        description: b.description,
        amount: amt,
        paymentMethod: 'TRANSFER',
        createdByName: 'Bank BCA',
        source: 'BANK_BCA',
        sourceBadge: 'Mutasi BCA',
        raw: b,
      })
    }
  }

  // 4. Add unlinked Maintenances if not already in FinancialTransaction
  const unlinkedMaintenances = await prisma.maintenance.findMany({
    where: {
      id: { notIn: Array.from(linkedMaintenanceIds) as string[] },
      totalCost: { gt: 0 },
    },
    include: { truck: true, createdBy: true },
    orderBy: { date: 'desc' },
  })

  for (const m of unlinkedMaintenances) {
    const cost = Number(m.totalCost || 0)
    if (cost > 0) {
      combinedList.push({
        id: `mnt-${m.id}`,
        transactionNumber: m.maintenanceNumber,
        type: 'EXPENSE',
        date: m.date,
        categoryName: 'Maintenance & Perbaikan',
        description: `Biaya Perbaikan/Service Truk ${m.truck?.policeNumber || ''} (${m.description})`,
        amount: cost,
        paymentMethod: 'CASH',
        createdByName: m.createdBy?.name || 'Maintenance',
        source: 'MAINTENANCE',
        sourceBadge: 'Maintenance',
        raw: m,
      })
    }
  }

  // Sort combined list by date descending
  combinedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Apply source filter if requested
  if (params?.sourceFilter && params.sourceFilter !== 'ALL') {
    return combinedList.filter((item) => item.source === params.sourceFilter)
  }

  return combinedList
}

export async function getPnLReportAction(startDate?: string, endDate?: string) {
  await requireAuth()

  const combinedTransactions = await getFinancialsAction({ startDate, endDate })

  let totalIncome = 0
  let totalExpense = 0

  const incomeByCategory: Record<string, number> = {}
  const expenseByCategory: Record<string, number> = {}

  for (const t of combinedTransactions) {
    const amt = Number(t.amount) || 0
    if (t.type === 'INCOME') {
      totalIncome += amt
      const catName = t.categoryName || 'Pemasukan Lain-lain'
      incomeByCategory[catName] = (incomeByCategory[catName] || 0) + amt
    } else {
      totalExpense += amt
      const catName = t.categoryName || 'Pengeluaran Lain-lain'
      expenseByCategory[catName] = (expenseByCategory[catName] || 0) + amt
    }
  }

  const netProfit = totalIncome - totalExpense

  return {
    totalIncome, // Guaranteed number >= 0
    totalExpense,
    netProfit,
    incomeByCategory,
    expenseByCategory,
    transactionCount: combinedTransactions.length,
  }
}

export async function syncAllFinancialDataAction() {
  const user = await requireFinanceOrOwner()

  let syncedCount = 0

  // 1. Sync unlinked Maintenances
  const unlinkedMaintenances = await prisma.maintenance.findMany({
    where: {
      totalCost: { gt: 0 },
      financialTransaction: { is: null },
    },
  })

  for (const m of unlinkedMaintenances) {
    const cost = Number(m.totalCost || 0)
    if (cost > 0) {
      const expCat = await prisma.expenseCategory.findFirst({
        where: { name: { contains: 'Maintenance', mode: 'insensitive' } },
      })
      await prisma.financialTransaction.create({
        data: {
          transactionNumber: `TRX-EXP-${Date.now().toString().slice(-6)}`,
          type: 'EXPENSE',
          date: m.date,
          expenseCategoryId: expCat?.id || null,
          description: `Biaya Perbaikan/Service Truck (${m.description})`,
          maintenanceId: m.id,
          amount: cost,
          paymentMethod: 'CASH',
          createdById: user.userId,
        },
      })
      syncedCount++
    }
  }

  // 2. Sync unlinked KasMutations
  const kasMutations = await prisma.kasMutation.findMany()
  for (const k of kasMutations) {
    const deb = Number(k.debit)
    const kre = Number(k.kredit)
    const type = k.jenis === 'Pemasukan' || kre > 0 ? 'INCOME' : 'EXPENSE'
    const amount = type === 'INCOME' ? kre : deb
    const dt = k.tanggal || new Date()

    if (amount > 0) {
      // Check if already created
      const existing = await prisma.financialTransaction.findFirst({
        where: { description: { contains: k.keterangan || 'Buku Kas' } },
      })

      if (!existing) {
        let catId: string | null = null
        if (type === 'INCOME') {
          const inc = await prisma.incomeCategory.findFirst({ where: { name: k.kategori } })
          catId = inc?.id || null
        } else {
          const exp = await prisma.expenseCategory.findFirst({ where: { name: k.kategori } })
          catId = exp?.id || null
        }

        await prisma.financialTransaction.create({
          data: {
            transactionNumber: `TRX-${type === 'INCOME' ? 'INC' : 'EXP'}-${Date.now().toString().slice(-6)}`,
            type,
            date: dt,
            incomeCategoryId: type === 'INCOME' ? catId : null,
            expenseCategoryId: type === 'EXPENSE' ? catId : null,
            description: k.keterangan || 'Mutasi Buku Kas',
            amount,
            paymentMethod: 'CASH',
            notes: k.catatan || undefined,
            createdById: user.userId,
          },
        })
        syncedCount++
      }
    }
  }

  await createAuditLog({
    action: 'SYNC_ALL_FINANCIAL_DATA',
    module: 'FINANCE',
    afterValue: { syncedCount },
  })

  revalidatePath('/financials')
  revalidatePath('/financials/spreadsheet-mutations')
  revalidatePath('/financials/bca-mutations')
  revalidatePath('/financials/piutang')
  revalidatePath('/dashboard')

  return { success: true, syncedCount }
}
