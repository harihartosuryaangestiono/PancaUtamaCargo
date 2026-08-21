'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireFinanceOrOwner } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'
import { parseIndonesianNumber, formatExcelDate } from '@/lib/utils/parseAmount'

export interface BcaMutationRowInput {
  dateRaw: string
  description: string
  branch: string
  amount: number
  type: 'CR' | 'DB'
  balance: number
}

export interface RawBcaRow {
  accountNo?: string
  accountName?: string
  currency?: string
  dateRaw: string
  description: string
  branch?: string
  amount: any
  type?: string
  balance: any
}

function parseIndonesianDate(dateStr: string): Date | null {
  const clean = dateStr.replace(/^'/, '').trim()
  if (!clean || clean.toUpperCase() === 'PEND') return null
  const parts = clean.split('/')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  return null
}

function cleanKlikBcaValue(val: string): string {
  if (!val) return ''
  let cleaned = val.trim()
  if (cleaned.startsWith("'")) {
    cleaned = cleaned.substring(1)
  }
  if (cleaned.startsWith('=')) {
    cleaned = cleaned.substring(1).trim()
    if (cleaned.startsWith("'")) {
      cleaned = cleaned.substring(1)
    }
  }
  return cleaned.trim()
}

export async function importBcaMutationsArrayAction(
  rows: RawBcaRow[],
  accountInfo?: { accountNo?: string; accountName?: string; currency?: string }
) {
  await requireFinanceOrOwner()
  if (!rows || rows.length === 0) {
    return { error: 'Data baris mutasi tidak boleh kosong.' }
  }

  const defaultAccountNo = accountInfo?.accountNo || '3445565568'
  const defaultAccountName = accountInfo?.accountName || 'HARIHARTO SURYA AN'
  const defaultCurrency = accountInfo?.currency || 'IDR'

  const itemsToInsert = rows.map((r) => {
    const formattedDateRaw = formatExcelDate(r.dateRaw)
    const amount = parseIndonesianNumber(r.amount)
    const balance = parseIndonesianNumber(r.balance)
    const rawType = (r.type || 'CR').toString().toUpperCase()
    const type = rawType.includes('DB') ? 'DB' : 'CR'

    return {
      accountNo: r.accountNo || defaultAccountNo,
      accountName: r.accountName || defaultAccountName,
      currency: r.currency || defaultCurrency,
      date: parseIndonesianDate(formattedDateRaw),
      dateRaw: String(formattedDateRaw || '').trim(),
      description: String(r.description || '').trim(),
      branch: r.branch ? String(r.branch).trim() : '0000',
      amount,
      type,
      balance,
    }
  }).filter(item => item.dateRaw || item.description)


  if (itemsToInsert.length === 0) {
    return { error: 'Tidak ada baris data mutasi yang valid.' }
  }

  const createdRecords = await prisma.bcaMutation.createMany({
    data: itemsToInsert,
  })

  await createAuditLog({
    action: 'IMPORT_KLIKBCA_MUTATIONS',
    module: 'FINANCE',
    afterValue: { insertedCount: createdRecords.count, accountNo: defaultAccountNo },
  })

  revalidatePath('/financials/bca-mutations')
  return {
    success: true,
    count: createdRecords.count,
    accountNo: defaultAccountNo,
    accountName: defaultAccountName,
    currency: defaultCurrency,
  }
}

export async function parseAndSaveKlikBcaCsvAction(csvText: string) {
  await requireFinanceOrOwner()

  if (!csvText || !csvText.trim()) {
    return { error: 'Isi CSV tidak boleh kosong.' }
  }

  const lines = csvText.split(/\r?\n/)
  
  let accountNo = ''
  let accountName = ''
  let currency = 'IDR'
  
  let startingBalance = 0
  let totalCreditHeader = 0
  let totalDebetHeader = 0
  let endingBalanceHeader = 0

  const rawRows: RawBcaRow[] = []
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = line.match(/(?:[^\s",]+|"[^"]*")+/g)?.map(c => c.replace(/^"|"$/g, '').trim()) || line.split(',')
    const rawLineLower = line.toLowerCase()

    if (rawLineLower.includes('account no') || rawLineLower.includes('no. rekening')) {
      const idx = cols.findIndex(c => c.toLowerCase().includes('account no') || c.toLowerCase().includes('no. rekening'))
      if (idx !== -1 && cols[idx + 1]) {
        accountNo = cleanKlikBcaValue(cols[cols.length - 1] || cols[idx + 1])
      } else {
        const parts = line.split(',')
        accountNo = cleanKlikBcaValue(parts[parts.length - 1])
      }
    } else if (rawLineLower.includes('name') || rawLineLower.includes('nama')) {
      const parts = line.split(',')
      accountName = cleanKlikBcaValue(parts[parts.length - 1])
    } else if (rawLineLower.includes('currency') || rawLineLower.includes('mata uang')) {
      const parts = line.split(',')
      currency = cleanKlikBcaValue(parts[parts.length - 1]) || 'IDR'
    } else if (rawLineLower.includes('starting balance') || rawLineLower.includes('saldo awal')) {
      const parts = line.split(',')
      startingBalance = parseIndonesianNumber(cleanKlikBcaValue(parts[parts.length - 1]))
    } else if (rawLineLower.includes('credit') || rawLineLower.includes('kredit')) {
      const parts = line.split(',')
      totalCreditHeader = parseIndonesianNumber(cleanKlikBcaValue(parts[parts.length - 1]))
    } else if (rawLineLower.includes('debet') || rawLineLower.includes('debit')) {
      const parts = line.split(',')
      totalDebetHeader = parseIndonesianNumber(cleanKlikBcaValue(parts[parts.length - 1]))
    } else if (rawLineLower.includes('ending balance') || rawLineLower.includes('saldo akhir')) {
      const parts = line.split(',')
      endingBalanceHeader = parseIndonesianNumber(cleanKlikBcaValue(parts[parts.length - 1]))
    }

    if (line.toLowerCase().includes('date') && line.toLowerCase().includes('description')) {
      inTable = true
      continue
    }

    if (inTable) {
      if (
        line.toLowerCase().includes('starting balance') ||
        line.toLowerCase().includes('credit,=') ||
        line.toLowerCase().includes('ending balance')
      ) {
        inTable = false
        continue
      }

      const parsedCols: string[] = []
      let insideQuote = false
      let currentVal = ''
      
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx]
        if (char === '"') {
          insideQuote = !insideQuote
        } else if (char === ',' && !insideQuote) {
          parsedCols.push(currentVal.trim())
          currentVal = ''
        } else {
          currentVal += char
        }
      }
      parsedCols.push(currentVal.trim())

      if (parsedCols.length >= 5) {
        const rawDate = cleanKlikBcaValue(parsedCols[0])
        const rawDesc = cleanKlikBcaValue(parsedCols[1])
        const rawBranch = cleanKlikBcaValue(parsedCols[2])
        
        let rawAmount: any = 0
        let rawType = 'CR'
        let rawBalance: any = 0

        if (parsedCols.length >= 6) {
          rawAmount = cleanKlikBcaValue(parsedCols[3])
          rawType = cleanKlikBcaValue(parsedCols[4]).toUpperCase() || 'CR'
          rawBalance = cleanKlikBcaValue(parsedCols[5])
        } else if (parsedCols.length === 5) {
          rawAmount = cleanKlikBcaValue(parsedCols[3])
          rawBalance = cleanKlikBcaValue(parsedCols[4])
        }

        if (rawDate && rawDesc) {
          rawRows.push({
            dateRaw: rawDate,
            description: rawDesc,
            branch: rawBranch || '0000',
            amount: rawAmount,
            type: rawType,
            balance: rawBalance,
          })
        }
      }
    }
  }

  const res = await importBcaMutationsArrayAction(rawRows, {
    accountNo: accountNo || '3445565568',
    accountName: accountName || 'HARIHARTO SURYA AN',
    currency: currency || 'IDR',
  })

  if (res.error) return res
  return {
    ...res,
    startingBalance,
    totalCreditHeader,
    totalDebetHeader,
    endingBalanceHeader,
  }
}

export async function getBcaMutationsAction(searchQuery?: string) {
  await requireAuth()

  const whereClause: any = {}
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim()
    whereClause.OR = [
      { description: { contains: q, mode: 'insensitive' } },
      { branch: { contains: q, mode: 'insensitive' } },
      { dateRaw: { contains: q, mode: 'insensitive' } },
      { accountNo: { contains: q, mode: 'insensitive' } },
    ]
  }

  const list = await prisma.bcaMutation.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' },
  })

  // Calculate summary metrics
  let totalCredit = 0
  let totalDebit = 0
  let startingBalance = 0
  let endingBalance = 0

  if (list.length > 0) {
    const firstRow = list[0]
    const lastRow = list[list.length - 1]

    const firstAmt = Number(firstRow.amount)
    const firstBal = Number(firstRow.balance)
    startingBalance = firstRow.type === 'CR' ? firstBal - firstAmt : firstBal + firstAmt
    endingBalance = Number(lastRow.balance)

    for (const item of list) {
      const amt = Number(item.amount)
      if (item.type === 'CR') {
        totalCredit += amt
      } else {
        totalDebit += amt
      }
    }
  }

  const accountInfo = list.length > 0 ? {
    accountNo: list[0].accountNo,
    accountName: list[0].accountName || 'HARIHARTO SURYA AN',
    currency: list[0].currency || 'IDR',
  } : {
    accountNo: '3445565568',
    accountName: 'HARIHARTO SURYA AN',
    currency: 'IDR',
  }

  return {
    mutations: list.map((item: any) => ({
      ...item,
      amount: Number(item.amount),
      balance: Number(item.balance),
    })),

    summary: {
      accountNo: accountInfo.accountNo,
      accountName: accountInfo.accountName,
      currency: accountInfo.currency,
      startingBalance,
      totalCredit,
      totalDebit,
      endingBalance,
      count: list.length,
    },
  }
}

export async function createManualBcaMutationAction(input: BcaMutationRowInput & { accountNo?: string; accountName?: string }) {
  await requireFinanceOrOwner()

  const dateObj = parseIndonesianDate(input.dateRaw)

  const created = await prisma.bcaMutation.create({
    data: {
      accountNo: input.accountNo || '3445565568',
      accountName: input.accountName || 'HARIHARTO SURYA AN',
      currency: 'IDR',
      date: dateObj,
      dateRaw: input.dateRaw,
      description: input.description,
      branch: input.branch || '0000',
      amount: input.amount,
      type: input.type,
      balance: input.balance,
    },
  })

  revalidatePath('/financials/bca-mutations')
  return { success: true, record: created }
}

export async function deleteBcaMutationAction(id: string) {
  await requireFinanceOrOwner()
  await prisma.bcaMutation.delete({ where: { id } })
  revalidatePath('/financials/bca-mutations')
  return { success: true }
}

export async function clearAllBcaMutationsAction() {
  await requireFinanceOrOwner()
  await prisma.bcaMutation.deleteMany({})
  revalidatePath('/financials/bca-mutations')
  return { success: true }
}
