'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireFinanceOrOwner } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'
import { KAS_CATEGORIES } from '@/lib/constants/kasCategories'


function parseIndonesianDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const clean = dateStr.replace(/^'/, '').trim()
  if (!clean) return null
  
  // Format DD/MM/YYYY or YYYY-MM-DD
  if (clean.includes('/')) {
    const parts = clean.split('/')
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const year = parseInt(parts[2], 10)
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day)
      }
    }
  } else if (clean.includes('-')) {
    const parts = clean.split('-')
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
      } else {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))
      }
    }
  }
  return null
}

import { parseIndonesianNumber, formatExcelDate } from '@/lib/utils/parseAmount'

export interface RawKasRow {
  tanggalRaw: string
  keterangan: string
  cabang?: string
  debit: any
  kredit: any
  saldo?: any
  kategori?: string
  jenis?: string
  catatan?: string
  pihakUtang?: string
  statusUtang?: string
}

export async function importKasMutationsArrayAction(rows: RawKasRow[]) {
  await requireFinanceOrOwner()
  if (!rows || rows.length === 0) {
    return { error: 'Data baris tidak boleh kosong.' }
  }

  const itemsToInsert = rows.map((r) => {
    const formattedDateRaw = formatExcelDate(r.tanggalRaw)
    const debit = parseIndonesianNumber(r.debit)
    const kredit = parseIndonesianNumber(r.kredit)
    const saldo = parseIndonesianNumber(r.saldo)
    let kategori = r.kategori ? String(r.kategori).trim() : 'Biaya Lain-lain'
    let jenis = r.jenis ? String(r.jenis).trim() : ''

    if (!jenis) {
      if (kredit > 0 && debit === 0) jenis = 'Pemasukan'
      else if (debit > 0) jenis = 'Pengeluaran'
      else {
        const found = KAS_CATEGORIES.find(c => c.name.toLowerCase() === kategori.toLowerCase())
        jenis = found ? found.jenis : 'Pengeluaran'
      }
    }

    return {
      tanggal: parseIndonesianDate(formattedDateRaw),
      tanggalRaw: String(formattedDateRaw || '').trim(),
      keterangan: String(r.keterangan || '').trim(),
      cabang: r.cabang ? String(r.cabang).trim() : '0',
      debit,
      kredit,
      saldo,
      kategori: kategori || 'Biaya Lain-lain',
      jenis: jenis || 'Pengeluaran',
      catatan: r.catatan ? String(r.catatan).trim() : '',
      pihakUtang: r.pihakUtang ? String(r.pihakUtang).trim() : '',
      statusUtang: r.statusUtang ? String(r.statusUtang).trim() : '',
    }
  }).filter(item => item.tanggalRaw || item.keterangan)


  if (itemsToInsert.length === 0) {
    return { error: 'Tidak ada baris data transaksi yang valid.' }
  }

  const createdRecords = await prisma.kasMutation.createMany({
    data: itemsToInsert,
  })

  await createAuditLog({
    action: 'IMPORT_SPREADSHEET_KAS_MUTATIONS',
    module: 'FINANCE',
    afterValue: { count: createdRecords.count },
  })

  revalidatePath('/financials/spreadsheet-mutations')
  return { success: true, count: createdRecords.count }
}

export async function parseAndSaveKasSpreadsheetCsvAction(csvText: string) {
  const user = await requireFinanceOrOwner()

  if (!csvText || !csvText.trim()) {
    return { error: 'Isi Spreadsheet CSV tidak boleh kosong.' }
  }

  const lines = csvText.split(/\r?\n/)
  const rawRows: RawKasRow[] = []

  let foundHeader = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line with quote awareness
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

    const lowerLine = line.toLowerCase()
    if (
      !foundHeader &&
      (lowerLine.includes('tanggal') || lowerLine.includes('keterangan'))
    ) {
      foundHeader = true
      continue
    }

    if (parsedCols.length >= 2) {
      const rawDate = parsedCols[0] ? parsedCols[0].replace(/^"|"$/g, '').trim() : ''
      const rawKeterangan = parsedCols[1] ? parsedCols[1].replace(/^"|"$/g, '').trim() : ''
      
      if (!rawDate && !rawKeterangan) continue
      if (rawDate.toLowerCase().includes('tanggal') || rawKeterangan.toLowerCase().includes('keterangan')) {
        continue
      }

      rawRows.push({
        tanggalRaw: rawDate,
        keterangan: rawKeterangan,
        cabang: parsedCols[2] ? parsedCols[2].replace(/^"|"$/g, '').trim() : '0',
        debit: parsedCols[3],
        kredit: parsedCols[4],
        saldo: parsedCols[5],
        kategori: parsedCols[6] ? parsedCols[6].replace(/^"|"$/g, '').trim() : 'Biaya Lain-lain',
        jenis: parsedCols[7] ? parsedCols[7].replace(/^"|"$/g, '').trim() : '',
        catatan: parsedCols[8] ? parsedCols[8].replace(/^"|"$/g, '').trim() : '',
        pihakUtang: parsedCols[9] ? parsedCols[9].replace(/^"|"$/g, '').trim() : '',
        statusUtang: parsedCols[10] ? parsedCols[10].replace(/^"|"$/g, '').trim() : '',
      })
    }
  }

  return await importKasMutationsArrayAction(rawRows)
}


export async function getKasMutationsAction(searchQuery?: string, categoryFilter?: string) {
  await requireAuth()

  const whereClause: any = {}
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim()
    whereClause.OR = [
      { keterangan: { contains: q, mode: 'insensitive' } },
      { catatan: { contains: q, mode: 'insensitive' } },
      { pihakUtang: { contains: q, mode: 'insensitive' } },
      { tanggalRaw: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (categoryFilter && categoryFilter !== 'ALL') {
    whereClause.kategori = categoryFilter
  }

  const list = await prisma.kasMutation.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' },
  })

  return list.map((item: any) => ({
    ...item,
    debit: Number(item.debit),
    kredit: Number(item.kredit),
    saldo: Number(item.saldo),
  }))

}

export async function updateKasMutationAction(
  id: string,
  input: {
    kategori?: string
    catatan?: string
    pihakUtang?: string
    statusUtang?: string
  }
) {
  await requireFinanceOrOwner()

  let updateData: any = { ...input }

  if (input.kategori) {
    const matched = KAS_CATEGORIES.find(c => c.name.toLowerCase() === input.kategori!.toLowerCase())
    if (matched) {
      updateData.jenis = matched.jenis
    }
  }

  const updated = await prisma.kasMutation.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/financials/spreadsheet-mutations')
  return { success: true, record: updated }
}

export async function createManualKasMutationAction(input: {
  tanggalRaw: string
  keterangan: string
  cabang?: string
  debit: number
  kredit: number
  saldo?: number
  kategori: string
  catatan?: string
  pihakUtang?: string
  statusUtang?: string
}) {
  await requireFinanceOrOwner()

  const dateObj = parseIndonesianDate(input.tanggalRaw)
  const matched = KAS_CATEGORIES.find(c => c.name.toLowerCase() === input.kategori.toLowerCase())
  const jenis = matched ? matched.jenis : (input.kredit > 0 ? 'Pemasukan' : 'Pengeluaran')

  const created = await prisma.kasMutation.create({
    data: {
      tanggal: dateObj,
      tanggalRaw: input.tanggalRaw,
      keterangan: input.keterangan,
      cabang: input.cabang || '0',
      debit: input.debit,
      kredit: input.kredit,
      saldo: input.saldo || 0,
      kategori: input.kategori,
      jenis,
      catatan: input.catatan || '',
      pihakUtang: input.pihakUtang || '',
      statusUtang: input.statusUtang || '',
    },
  })

  revalidatePath('/financials/spreadsheet-mutations')
  return { success: true, record: created }
}

export async function deleteKasMutationAction(id: string) {
  await requireFinanceOrOwner()
  await prisma.kasMutation.delete({ where: { id } })
  revalidatePath('/financials/spreadsheet-mutations')
  return { success: true }
}

export async function clearAllKasMutationsAction() {
  await requireFinanceOrOwner()
  await prisma.kasMutation.deleteMany({})
  revalidatePath('/financials/spreadsheet-mutations')
  return { success: true }
}

export async function getKasSummaryAction(selectedYear: number = 2026) {
  await requireAuth()

  const allItems = await prisma.kasMutation.findMany({
    orderBy: { createdAt: 'asc' },
  })

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const monthlySummary = months.map(m => ({
    bulan: m,
    pemasukan: 0,
    pengeluaran: 0,
    labaRugi: 0,
  }))

  const categoryTotalsMap: Record<string, { jenis: string; total: number }> = {}

  // Initialize category map with defaults
  KAS_CATEGORIES.forEach(c => {
    categoryTotalsMap[c.name] = { jenis: c.jenis, total: 0 }
  })

  let totalYearIncome = 0
  let totalYearExpense = 0

  for (const item of allItems) {
    const deb = Number(item.debit)
    const kre = Number(item.kredit)
    const dt = item.tanggal || parseIndonesianDate(item.tanggalRaw)

    const itemYear = dt ? dt.getFullYear() : 2026
    const monthIndex = dt ? dt.getMonth() : -1

    // Category Aggregation across all transactions or selected year
    const cat = item.kategori || 'Biaya Lain-lain'
    const foundCat = KAS_CATEGORIES.find(c => c.name.toLowerCase() === cat.toLowerCase())
    const jenis = item.jenis || (foundCat ? foundCat.jenis : (kre > 0 ? 'Pemasukan' : 'Pengeluaran'))

    const amount = jenis === 'Pemasukan' ? kre : deb

    if (!categoryTotalsMap[cat]) {
      categoryTotalsMap[cat] = { jenis, total: 0 }
    }
    categoryTotalsMap[cat].total += amount

    // Monthly Aggregation for selected year
    if (itemYear === selectedYear && monthIndex >= 0 && monthIndex < 12) {
      if (jenis === 'Pemasukan') {
        monthlySummary[monthIndex].pemasukan += kre
        totalYearIncome += kre
      } else {
        monthlySummary[monthIndex].pengeluaran += deb
        totalYearExpense += deb
      }
    }
  }

  // Calculate Laba/Rugi for each month
  monthlySummary.forEach(m => {
    m.labaRugi = m.pemasukan - m.pengeluaran
  })

  const totalYearNet = totalYearIncome - totalYearExpense

  const categoryRecapList = Object.keys(categoryTotalsMap).map(catName => ({
    kategori: catName,
    jenis: categoryTotalsMap[catName].jenis,
    total: categoryTotalsMap[catName].total,
  }))

  return {
    selectedYear,
    monthlySummary,
    totalYearIncome,
    totalYearExpense,
    totalYearNet,
    categoryRecapList,
  }
}
