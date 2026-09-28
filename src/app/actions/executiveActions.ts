'use server'

import { requireAuth } from '@/lib/session'
import { getExecutiveDashboard, PeriodFilter } from '@/lib/reports/executiveReportService'
import { createAuditLog } from '@/lib/services/auditService'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function getExecutiveDashboardAction(
  period: PeriodFilter = 'THIS_MONTH',
  startDate?: string,
  endDate?: string,
  targetMonthKey?: string
) {
  const session = await requireAuth()

  const data = await getExecutiveDashboard(period, startDate, endDate, targetMonthKey)

  await createAuditLog({
    action: 'EXECUTIVE_REPORT_VIEW',
    module: 'REPORTS',
    recordId: `EXEC-REPORT-${period}-${targetMonthKey || 'DEFAULT'}`,
    afterValue: { period, startDate, endDate, targetMonthKey, userId: session.userId },
  })

  return JSON.parse(JSON.stringify(data))
}

export async function downloadMonthlyPnLExcelAction(monthKey: string) {
  const session = await requireAuth()

  const fullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const [yearStr, monthStr] = monthKey.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const monthName = fullMonthNames[month - 1] || 'Bulan'
  const periodLabel = `${monthName} ${year}`

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  // Fetch contracts for this month
  const contracts = await prisma.tripContract.findMany({
    where: {
      startDate: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
    },
    include: {
      truck: true,
      customer: true,
      driver: true,
      legs: true,
      advances: true,
      settlements: true,
    },
    orderBy: { startDate: 'asc' },
  })

  // Fetch financial transactions for this month
  const finTransactions = await prisma.financialTransaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: { expenseCategory: true, incomeCategory: true },
    orderBy: { date: 'asc' },
  })

  // 1. Calculate P&L metrics
  let grossContractValue = 0
  let driverShare = 0
  let companyToll = 0
  let driverToll = 0
  let totalToll = 0
  let fuelCost = 0
  let otherTripCost = 0
  let totalDistanceKm = 0
  let customerPaymentsReceived = 0

  contracts.forEach((c) => {
    customerPaymentsReceived += Number(c.paidAmount || 0)
    c.legs.forEach((leg) => {
      const v = Number(leg.contractValue || 0)
      const t = Number(leg.tollCost || 0)
      const ct = Number(leg.companyTollCost || t * 0.6)
      const dt = Number(leg.driverTollCost || t * 0.4)
      const f = Number(leg.fuelCost || 0)
      const o = Number(leg.otherCost || 0)

      grossContractValue += v
      driverShare += v * ((leg.driverPercentage || 53) / 100)
      totalToll += t
      companyToll += ct
      driverToll += dt
      fuelCost += f
      otherTripCost += o
      totalDistanceKm += leg.distanceKm || 0
    })
  })

  const taxDeduction = grossContractValue * 0.02
  const netContractValue = grossContractValue * 0.98

  let otherIncome = 0
  let maintenanceCost = 0
  let tireCost = 0
  let sparepartCost = 0
  let truckLeasingCost = 0
  let bankAndAdminCost = 0
  let officeAndOtherCost = 0

  const expenseRows: any[] = []

  finTransactions.forEach((f) => {
    const amt = Number(f.amount || 0)
    const catName = f.expenseCategory?.name || f.incomeCategory?.name || ''
    const desc = f.description || ''

    if (f.type === 'INCOME') {
      const cat = catName.toLowerCase()
      if (!f.contractId && cat !== 'hasil pengiriman') {
        otherIncome += amt
      }
    } else {
      let classification = 'Operasional Kantor Lainnya'
      const catLower = catName.toLowerCase()
      const descLower = desc.toLowerCase()

      if (catLower.includes('maintenance') || /service|maintenance|ganti filter|kelistrikan|bengkel/i.test(descLower)) {
        classification = 'Maintenance & Bengkel Armada'
        maintenanceCost += amt
      } else if (catLower.includes('ban') || /\bban\b|pecah ban|vulkanisir/i.test(descLower)) {
        classification = 'Ban Armada'
        tireCost += amt
      } else if (catLower.includes('sparepart') || /sparepart|onderdil/i.test(descLower)) {
        classification = 'Sparepart & Suku Cadang'
        sparepartCost += amt
      } else if (/dipostar|leasing|angsuran truk/i.test(descLower)) {
        classification = 'Cicilan / Leasing Truk'
        truckLeasingCost += amt
      } else if (/bi-fast|atm|biaya txn|tarikan pemindahan|administrasi/i.test(descLower)) {
        classification = 'Administrasi Bank & Kas'
        bankAndAdminCost += amt
      } else if (catLower.includes('bahan bakar') || /spbu|solar|bbm/i.test(descLower)) {
        classification = 'BBM Solar Armada'
        fuelCost += amt
      } else if (catLower.includes('tol') || /flazz|e-toll/i.test(descLower)) {
        classification = 'Tol Armada'
        companyToll += amt
      } else {
        officeAndOtherCost += amt
      }

      expenseRows.push([
        f.date.toISOString().slice(0, 10),
        f.transactionNumber,
        classification,
        desc,
        f.paymentMethod || 'TRANSFER',
        amt,
      ])
    }
  })

  const totalDirectTripCosts = driverShare + companyToll + fuelCost + otherTripCost
  const grossProfit = netContractValue - totalDirectTripCosts
  const grossProfitMargin = netContractValue > 0 ? (grossProfit / netContractValue) * 100 : 0

  const totalOperatingExpenses =
    maintenanceCost + tireCost + sparepartCost + truckLeasingCost + bankAndAdminCost + officeAndOtherCost
  const totalNetRevenue = netContractValue + otherIncome
  const netOperatingProfit = grossProfit + otherIncome - totalOperatingExpenses
  const netProfitMargin = totalNetRevenue > 0 ? (netOperatingProfit / totalNetRevenue) * 100 : 0
  const outstandingReceivables = Math.max(0, grossContractValue - customerPaymentsReceived)

  // 2. Build Sheet 1: Laporan Laba Rugi
  const formatPct = (val: number, base: number) => (base > 0 ? `${((val / base) * 100).toFixed(1)}%` : '0.0%')

  const pnlRows: any[][] = [
    ['PT PANCA UTAMA CARGO'],
    ['LAPORAN LABA RUGI KOMPREHENSIF (MONTHLY PROFIT & LOSS)'],
    [`Periode: ${periodLabel} (${monthKey})`],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
    [],
    ['KOMPONEN KEUANGAN', 'NOMINAL (RP)', 'RASIO TERHADAP PENDAPATAN'],
    ['I. PENDAPATAN OPERASIONAL JASA ANGKUT', '', ''],
    ['   Pendapatan Bruto Nilai Kontrak', grossContractValue, formatPct(grossContractValue, totalNetRevenue)],
    ['   Potongan PPh 23 (2%)', -taxDeduction, formatPct(-taxDeduction, totalNetRevenue)],
    ['   Pendapatan Bersih Kontrak (98%)', netContractValue, formatPct(netContractValue, totalNetRevenue)],
    ['   Pendapatan Operasional Lain-lain', otherIncome, formatPct(otherIncome, totalNetRevenue)],
    ['TOTAL PENDAPATAN BERSIH OPERASIONAL', totalNetRevenue, '100.0%'],
    [],
    ['II. BEBAN POKOK PENDAPATAN (BIAYA TRIP LANGSUNG)', '', ''],
    ['   Hak Jasa Pengemudi / Supir (53% Nilai Kontrak)', driverShare, formatPct(driverShare, totalNetRevenue)],
    ['   Beban Tol Armada (Porsi Perusahaan 60%)', companyToll, formatPct(companyToll, totalNetRevenue)],
    ['   Beban Bahan Bakar Minyak (BBM Solar)', fuelCost, formatPct(fuelCost, totalNetRevenue)],
    ['   Biaya Inap & Operasional Perjalanan', otherTripCost, formatPct(otherTripCost, totalNetRevenue)],
    ['TOTAL BEBAN POKOK PENDAPATAN (DIRECT TRIP COSTS)', totalDirectTripCosts, formatPct(totalDirectTripCosts, totalNetRevenue)],
    [],
    ['LABA KOTOR OPERASIONAL TRIP (GROSS PROFIT)', grossProfit, `${grossProfitMargin.toFixed(1)}%`],
    [],
    ['III. BEBAN OPERASIONAL, PERAWATAN & OVERHEAD', '', ''],
    ['   Biaya Servis & Perawatan Bengkel Armada', maintenanceCost, formatPct(maintenanceCost, totalNetRevenue)],
    ['   Biaya Ban Armada (Beli & Perbaikan Ban)', tireCost, formatPct(tireCost, totalNetRevenue)],
    ['   Biaya Suku Cadang & Sparepart', sparepartCost, formatPct(sparepartCost, totalNetRevenue)],
    ['   Cicilan / Angsuran Leasing Truk (Dipostar)', truckLeasingCost, formatPct(truckLeasingCost, totalNetRevenue)],
    ['   Administrasi Bank, Bi-Fast & Kas Operasional', bankAndAdminCost, formatPct(bankAndAdminCost, totalNetRevenue)],
    ['   Biaya Operasional Kantor Lainnya', officeAndOtherCost, formatPct(officeAndOtherCost, totalNetRevenue)],
    ['TOTAL BEBAN OPERASIONAL & OVERHEAD', totalOperatingExpenses, formatPct(totalOperatingExpenses, totalNetRevenue)],
    [],
    ['IV. LABA BERSIH OPERASIONAL (NET OPERATING PROFIT)', netOperatingProfit, `${netProfitMargin.toFixed(1)}%`],
    [],
    ['V. RINGKASAN ARUS KAS & OPERASIONAL BULANAN', '', ''],
    ['   Total Kontrak Trip Selesai', contracts.length, 'Trip'],
    ['   Total Jarak Tempuh Armada', totalDistanceKm, 'KM'],
    ['   Pembayaran Masuk Diterima dari Pelanggan', customerPaymentsReceived, formatPct(customerPaymentsReceived, grossContractValue)],
    ['   Sisa Piutang Usaha Belum Tertagih', outstandingReceivables, formatPct(outstandingReceivables, grossContractValue)],
    [],
    [],
    ['Disetujui Oleh:', '', 'Dibuat Oleh:'],
    ['', '', ''],
    ['', '', ''],
    ['( Direktur Utama / Owner )', '', '( Bagian Keuangan / Finance )'],
    ['PT Panca Utama Cargo', '', 'PT Panca Utama Cargo'],
  ]

  // 3. Build Sheet 2: Rincian Kontrak Trip
  const contractHeader = [
    'No Kontrak',
    'Tanggal Mulai',
    'Pelanggan',
    'Kode Truk',
    'Nopol Truk',
    'Nama Supir',
    'Rute Berangkat (ERP 1)',
    'Rute Pulang (ERP 2)',
    'Jarak (KM)',
    'Nilai Kontrak Bruto (Rp)',
    'PPh 23 (2%)',
    'Nilai Bersih 98% (Rp)',
    'Hak Supir 53% (Rp)',
    'Beban Tol PT 60% (Rp)',
    'BBM Solar (Rp)',
    'Status Kontrak',
    'Status Bayar',
    'Sudah Dibayar (Rp)',
    'Sisa Piutang (Rp)',
  ]

  const contractDataRows: any[][] = contracts.map((c) => {
    const leg1 = c.legs.find((l) => l.legNumber === 1) || c.legs[0]
    const leg2 = c.legs.find((l) => l.legNumber === 2) || c.legs[1]
    const cGross = c.legs.reduce((s, l) => s + Number(l.contractValue || 0), 0)
    const cDist = c.legs.reduce((s, l) => s + (l.distanceKm || 0), 0)
    const cToll = c.legs.reduce((s, l) => s + Number(l.companyTollCost || Number(l.tollCost || 0) * 0.6), 0)
    const cFuel = c.legs.reduce((s, l) => s + Number(l.fuelCost || 0), 0)
    const cDriver = cGross * 0.53
    const cPaid = Number(c.paidAmount || 0)
    const cReceivable = Math.max(0, cGross - cPaid)

    return [
      c.contractNumber,
      c.startDate.toISOString().slice(0, 10),
      c.customer?.name || '-',
      c.truck?.truckCode || '-',
      c.truck?.policeNumber || '-',
      c.driverName || c.driver?.name || '-',
      leg1 ? `${leg1.origin} → ${leg1.destination}` : '-',
      leg2 ? `${leg2.origin} → ${leg2.destination}` : '-',
      cDist,
      cGross,
      cGross * 0.02,
      cGross * 0.98,
      cDriver,
      cToll,
      cFuel,
      c.status,
      c.paymentStatus,
      cPaid,
      cReceivable,
    ]
  })

  // 4. Build Sheet 3: Rincian Beban Operasional
  const expenseHeader = ['Tanggal', 'No. Transaksi', 'Kategori Beban', 'Deskripsi / Keterangan', 'Metode Bayar', 'Jumlah (Rp)']

  // Create workbook
  const wb = XLSX.utils.book_new()

  const wsPnl = XLSX.utils.aoa_to_sheet(pnlRows)
  wsPnl['!cols'] = [{ wch: 48 }, { wch: 22 }, { wch: 25 }]
  XLSX.utils.book_append_sheet(wb, wsPnl, 'Laporan Laba Rugi')

  const wsContracts = XLSX.utils.aoa_to_sheet([contractHeader, ...contractDataRows])
  wsContracts['!cols'] = [
    { wch: 16 }, { wch: 12 }, { wch: 26 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
    { wch: 24 }, { wch: 24 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 20 },
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsContracts, 'Rincian Kontrak Trip')

  const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeader, ...expenseRows])
  wsExpenses['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 28 }, { wch: 45 }, { wch: 14 }, { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Rincian Beban Operasional')

  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
  const filename = `Laporan_Laba_Rugi_PancaUtamaCargo_${monthKey}.xlsx`

  await createAuditLog({
    action: 'DOWNLOAD_MONTHLY_PNL_EXCEL',
    module: 'REPORTS',
    recordId: `EXCEL-PNL-${monthKey}`,
    afterValue: { monthKey, periodLabel, netOperatingProfit, userId: session.userId },
  })

  return {
    success: true,
    filename,
    base64,
  }
}

export async function exportExecutiveReportAction(
  period: PeriodFilter = 'THIS_MONTH',
  startDate?: string,
  endDate?: string,
  targetMonthKey?: string
) {
  const session = await requireAuth()

  const data = await getExecutiveDashboard(period, startDate, endDate, targetMonthKey)

  await createAuditLog({
    action: 'REPORT_EXPORT',
    module: 'REPORTS',
    recordId: `EXEC-EXPORT-${period}`,
    afterValue: { period, startDate, endDate, userId: session.userId },
  })

  // Generate CSVs
  const monthlyCsvHeader = 'Bulan,Jumlah Kontrak,Total Jarak (KM),Pendapatan Bruto,Pendapatan Bersih (98%),Hak Supir (53%),Tol Armada,BBM Solar,Maintenance,Sparepart,Ban,Leasing Dipostar,Admin Kas,Beban Lain,Total Beban,Laba Bersih,Margin (%)\n'
  const monthlyCsvRows = data.monthlyProfitability
    .map(
      (m: any) =>
        `"${m.label}",${m.contractsCount},${m.distanceKm},${m.grossRevenue},${m.revenue},${m.driverShare},${m.tollCost},${m.fuelCost},${m.maintenanceCost},${m.sparepartCost},${m.tireCost},${m.leasingCost || 0},${m.adminCost || 0},${m.otherCost},${m.totalCost},${m.netProfit},${m.profitMargin.toFixed(1)}%`
    )
    .join('\n')

  const contractCsvHeader = 'No Kontrak,Pelanggan,Truk,Supir,ERP 1 Nilai,ERP 2 Nilai,Total Pendapatan,Hak Supir (53%),Hak PT (47%),BBM,Tol,Biaya Lain,Total Biaya,Laba Bersih,Margin (%)\n'
  const contractCsvRows = data.contractProfitability
    .map(
      (c: any) =>
        `"${c.contractNumber}","${c.customerName}","${c.truckCode}","${c.driverName}",${c.erp1Revenue},${c.erp2Revenue},${c.totalRevenue},${c.driverShare},${c.companyShare},${c.fuelCost},${c.tollCost},${c.otherCost},${c.totalCost},${c.netProfit},${c.profitMargin.toFixed(1)}%`
    )
    .join('\n')

  const fleetCsvHeader = 'Peringkat,Kode Truk,Nopol Truk,Total KM,Jumlah Kontrak,Pendapatan,BBM,Tol,Maintenance,Total Biaya,Laba Bersih\n'
  const fleetCsvRows = data.fleetProfitability
    .map(
      (f: any) =>
        `${f.rank},"${f.truckCode}","${f.policeNumber}",${f.totalKm},${f.contractsCount},${f.revenue},${f.fuelCost},${f.tollCost},${f.maintenanceCost},${f.totalCost},${f.netProfit}`
    )
    .join('\n')

  return {
    success: true,
    files: {
      monthlyProfitabilityCsv: monthlyCsvHeader + monthlyCsvRows,
      contractProfitabilityCsv: contractCsvHeader + contractCsvRows,
      fleetProfitabilityCsv: fleetCsvHeader + fleetCsvRows,
    },
  }
}
