'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Calendar,
  ChevronDown,
  Plus,
  Truck as TruckIcon,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Scale,
  DollarSign,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import { PeriodFilter } from '@/lib/reports/executiveReportService'
import Link from 'next/link'

interface Props {
  initialData: any
  initialPeriod: PeriodFilter
  userRole: string
}

export function ExecutiveDashboardClient({ initialData, initialPeriod, userRole }: Props) {
  const [data, setData] = useState<any>(initialData)
  const [period, setPeriod] = useState<PeriodFilter>(initialPeriod)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    initialData.monthlyPnLStatement?.monthKey || '2026-09'
  )
  const [loading, setLoading] = useState(false)
  const [downloadingExcel, setDownloadingExcel] = useState(false)
  const [showExpenseDetails, setShowExpenseDetails] = useState(false)

  const handlePeriodChange = async (newPeriod: PeriodFilter, start?: string, end?: string) => {
    setPeriod(newPeriod)
    setLoading(true)
    try {
      const { getExecutiveDashboardAction } = await import('@/app/actions/executiveActions')
      const updated = await getExecutiveDashboardAction(newPeriod, start || customStart, end || customEnd, selectedMonthKey)
      setData(updated)
      if (updated.monthlyPnLStatement?.monthKey) {
        setSelectedMonthKey(updated.monthlyPnLStatement.monthKey)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = async (monthKey: string) => {
    setSelectedMonthKey(monthKey)
    setLoading(true)
    try {
      const { getExecutiveDashboardAction } = await import('@/app/actions/executiveActions')
      const updated = await getExecutiveDashboardAction(period, customStart, customEnd, monthKey)
      setData(updated)
    } catch (err) {
      console.error('Failed to switch month:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async (targetMonth?: string) => {
    const month = targetMonth || selectedMonthKey
    setDownloadingExcel(true)
    try {
      const { downloadMonthlyPnLExcelAction } = await import('@/app/actions/executiveActions')
      const res = await downloadMonthlyPnLExcelAction(month)
      if (res.success && res.base64) {
        const byteCharacters = atob(res.base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename || `Laporan_Laba_Rugi_${month}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Failed to download Excel:', err)
      alert('Gagal mengunduh file Excel laporan bulanan.')
    } finally {
      setDownloadingExcel(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      const { exportExecutiveReportAction } = await import('@/app/actions/executiveActions')
      const res = await exportExecutiveReportAction(period, customStart, customEnd, selectedMonthKey)
      if (res.success) {
        const blob = new Blob([res.files.monthlyProfitabilityCsv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Executive_Monthly_Profitability_${period}_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Failed to export CSV:', err)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const s = data.summary
  const pnl = data.monthlyPnLStatement
  const availableMonths = data.availableMonths || []
  const isDataEmpty = s.totalContracts === 0

  // Time-based Greeting
  const currentHour = new Date().getHours()
  let timeGreeting = 'Selamat malam'
  if (currentHour < 11) timeGreeting = 'Selamat pagi'
  else if (currentHour < 15) timeGreeting = 'Selamat siang'
  else if (currentHour < 18) timeGreeting = 'Selamat sore'

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 sm:space-y-8 text-[#1D1D1F]">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            {timeGreeting}, Hariharto
          </h1>
          <p className="text-xs text-[#6E6E73] font-medium mt-1 flex items-center gap-2">
            <span>Executive Business &amp; Financial Overview</span>
            <span className="text-black/20">•</span>
            <span>{formattedDate}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter Dropdown */}
          <div className="relative inline-block">
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as PeriodFilter)}
              className="appearance-none bg-white text-[#1D1D1F] text-xs font-semibold px-4 py-2.5 pr-8 rounded-xl border border-black/[0.08] shadow-2xs hover:bg-[#FAFAFA] transition-all cursor-pointer outline-none"
            >
              <option value="THIS_MONTH">Bulan Ini (September)</option>
              <option value="LAST_MONTH">Bulan Lalu (Agustus)</option>
              <option value="THIS_WEEK">Minggu Ini</option>
              <option value="LAST_3_MONTHS">3 Bulan Terakhir</option>
              <option value="THIS_YEAR">Tahun Ini (2026)</option>
              <option value="ALL_TIME">Semua Waktu</option>
              <option value="CUSTOM">Rentang Kustom</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6E6E73] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {period === 'CUSTOM' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-[#1D1D1F] text-xs outline-none"
              />
              <span className="text-[#6E6E73]">s/d</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-[#1D1D1F] text-xs outline-none"
              />
              <button
                onClick={() => handlePeriodChange('CUSTOM')}
                className="px-3 py-2 bg-[#007AFF] text-white rounded-xl font-semibold text-xs hover:bg-[#0062CC]"
              >
                Terapkan
              </button>
            </div>
          )}

          {/* Quick Action: Download Excel Laporan Bulanan */}
          <button
            onClick={() => handleDownloadExcel(selectedMonthKey)}
            disabled={downloadingExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            title="Download Laporan Laba Rugi Bulanan Lengkap dalam format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloadingExcel ? 'Menyiapkan Excel...' : 'Download Excel Bulanan'}</span>
          </button>

          {/* Action Button: Print PDF */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
            title="Cetak atau Simpan PDF Laporan Bulanan Resmi"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE OFFICIAL LETTERHEAD FOR PRINT / PDF MODE */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-4 text-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight">PT PANCA UTAMA CARGO</h1>
            <p className="text-xs text-gray-700">Jasa Angkutan &amp; Ekspedisi Logistik Truk Tronton Antar Kota Antar Provinsi</p>
            <p className="text-xs text-gray-600 mt-0.5">Jl. Raya Industri, Pergudangan Panca Utama, Indonesia</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 bg-gray-100 border border-gray-300 rounded">
              DOKUMEN RESMI
            </span>
            <p className="text-[11px] text-gray-600 mt-2">Dicetak: {formattedDate}</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-300 text-center">
          <h2 className="text-lg font-bold uppercase">LAPORAN LABA RUGI KOMPREHENSIF BULANAN</h2>
          <p className="text-xs font-semibold text-gray-800">
            Periode: {pnl?.periodLabel || period}
          </p>
        </div>
      </div>

      {/* EMPTY STATE IF ZERO CONTRACTS */}
      {isDataEmpty ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto my-6 sm:my-12">
          <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">Dashboard Keuangan Siap Digunakan</h3>
            <p className="text-xs text-[#6E6E73] mt-1 max-w-md mx-auto">
              Mulai dengan mencatat kontrak perjalanan pertama Anda untuk menghasilkan laporan laba rugi dan analisis performa armada secara langsung.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/contracts"
              className="px-5 py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-xl text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Buat Kontrak Baru
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* PROFIT HERO SECTION */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
              {/* Left Hero Focus: NET PROFIT */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#6E6E73] tracking-widest uppercase block">
                    NET PROFIT (Laba Bersih Perusahaan)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                    Periode {period}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
                  <h2 className={`text-3xl sm:text-5xl font-black tracking-tight ${s.netProfit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {formatCurrency(s.netProfit)}
                  </h2>
                  {s.profitGrowthPct !== null && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                        s.profitGrowthPct >= 0
                          ? 'bg-[#34C759]/10 text-[#248A3D]'
                          : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                      }`}
                    >
                      {s.profitGrowthPct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {s.profitGrowthPct >= 0 ? '+' : ''}
                      {s.profitGrowthPct.toFixed(1)}% vs periode lalu
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6E6E73]">
                  Dihitung dari Total Pendapatan Bersih dikurangi Hak Supir (53%) dan seluruh beban operasional (Tol, BBM, Servis, Ban, Leasing, &amp; Kas).
                </p>
              </div>

              {/* Right Sub-metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-black/[0.08] lg:pl-8">
                <div>
                  <span className="text-[11px] font-medium text-[#6E6E73] block mb-1">Total Pendapatan</span>
                  <p className="text-lg sm:text-xl font-bold text-[#1D1D1F]">{formatCurrency(s.totalRevenue)}</p>
                  <span className="text-[10px] text-[#6E6E73]">Kontrak 98% + Pendapatan Lain</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-[#6E6E73] block mb-1">Total Beban Operasional</span>
                  <p className="text-lg sm:text-xl font-bold text-[#1D1D1F]">{formatCurrency(s.totalOperatingCost)}</p>
                  <span className="text-[10px] text-[#6E6E73]">Tol, BBM, Servis, Ban, Leasing</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-[#6E6E73] block mb-1">Profit Margin</span>
                  <p className={`text-lg sm:text-xl font-bold ${s.profitMargin >= 25 ? 'text-[#34C759]' : s.profitMargin >= 0 ? 'text-[#007AFF]' : 'text-[#FF3B30]'}`}>
                    {s.profitMargin.toFixed(1)}%
                  </p>
                  <span className="text-[10px] text-[#6E6E73]">Laba Bersih / Pendapatan</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 CLEAN KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* CARD 1: REVENUE */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-2 hover:-translate-y-[1px] transition-all duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6E73]">
                <span>Total Pendapatan</span>
                {s.revenueGrowthPct !== null && (
                  <span className={`font-semibold ${s.revenueGrowthPct >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {s.revenueGrowthPct >= 0 ? '+' : ''}{s.revenueGrowthPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{formatCurrency(s.totalRevenue)}</p>
              <span className="text-[10px] text-[#6E6E73] block">Nilai Bruto Kontrak: {formatCurrency(s.grossRevenue)}</span>
            </div>

            {/* CARD 2: OPERATING COST */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-2 hover:-translate-y-[1px] transition-all duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6E73]">
                <span>Beban Operasional</span>
                {s.costGrowthPct !== null && (
                  <span className={`font-semibold ${s.costGrowthPct <= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {s.costGrowthPct >= 0 ? '+' : ''}{s.costGrowthPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{formatCurrency(s.totalOperatingCost)}</p>
              <span className="text-[10px] text-[#6E6E73] block">Tol, BBM, Servis, Ban &amp; Leasing</span>
            </div>

            {/* CARD 3: NET PROFIT */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-2 hover:-translate-y-[1px] transition-all duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6E73]">
                <span>Laba Bersih (Net)</span>
                {s.profitGrowthPct !== null && (
                  <span className={`font-semibold ${s.profitGrowthPct >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {s.profitGrowthPct >= 0 ? '+' : ''}{s.profitGrowthPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className={`text-2xl font-bold tracking-tight ${s.netProfit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                {formatCurrency(s.netProfit)}
              </p>
              <span className="text-[10px] text-[#6E6E73] block">Kontribusi Bersih Perusahaan</span>
            </div>

            {/* CARD 4: PROFIT MARGIN */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-2 hover:-translate-y-[1px] transition-all duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6E73]">
                <span>Margin Keuntungan</span>
                {s.marginGrowthPts !== null && (
                  <span className={`font-semibold ${s.marginGrowthPts >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {s.marginGrowthPts >= 0 ? '+' : ''}{s.marginGrowthPts.toFixed(1)} pts
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{s.profitMargin.toFixed(1)}%</p>
              <span className="text-[10px] text-[#6E6E73] block">Rasio Efisiensi Usaha</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PRIMARY FOCUS: LAPORAN LABA RUGI BULANAN RESMI (MONTHLY P&L STATEMENT)   */}
          {/* ========================================================================= */}
          {pnl && (
            <div className="bg-white rounded-2xl border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* Card Header & Controls */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF] text-white uppercase tracking-wider">
                      LAPORAN RESMI KEUANGAN
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90">
                      Standar Akuntansi Angkutan
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Laporan Laba Rugi — {pnl.periodLabel}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Ringkasan resmi pendapatan jasa angkut, beban langsung trip supir/tol, beban perawatan armada, dan laba bersih 100% presisi.
                  </p>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Month Switcher Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedMonthKey}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      className="appearance-none bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 pr-8 rounded-xl border border-white/20 transition-all cursor-pointer outline-none"
                    >
                      {availableMonths.map((m: any) => (
                        <option key={m.monthKey} value={m.monthKey} className="text-black bg-white">
                          {m.label} {m.hasData ? `(${m.contractsCount} Trip)` : '(Belum Ada Data)'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-white/70 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Button Download Excel (.xlsx) */}
                  <button
                    onClick={() => handleDownloadExcel(selectedMonthKey)}
                    disabled={downloadingExcel}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{downloadingExcel ? 'Mengunduh...' : 'Download Excel (.xlsx)'}</span>
                  </button>

                  {/* Button Cetak / PDF */}
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-[#007AFF]" />
                    <span>Cetak / PDF</span>
                  </button>
                </div>
              </div>

              {/* Month Quick Selector Tabs */}
              <div className="px-6 py-3 bg-slate-50 border-b border-black/[0.06] flex items-center gap-2 overflow-x-auto print:hidden">
                <span className="text-[11px] font-semibold text-[#6E6E73] shrink-0 mr-1">Pilih Bulan:</span>
                {availableMonths
                  .filter((m: any) => m.hasData || m.monthKey.endsWith('-08') || m.monthKey.endsWith('-09') || m.monthKey.endsWith('-07'))
                  .map((m: any) => (
                    <button
                      key={m.monthKey}
                      onClick={() => handleMonthChange(m.monthKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        selectedMonthKey === m.monthKey
                          ? 'bg-[#007AFF] text-white shadow-xs'
                          : 'bg-white text-[#1D1D1F] border border-black/[0.08] hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.label}</span>
                      {m.contractsCount > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            selectedMonthKey === m.monthKey ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {m.contractsCount} trip
                        </span>
                      )}
                    </button>
                  ))}
              </div>

              {/* Income Statement Table Structure */}
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black/[0.1] text-[11px] text-[#6E6E73] font-bold uppercase tracking-wider bg-[#FAFAFA]">
                      <th className="py-3 px-4">Pos / Komponen Keuangan</th>
                      <th className="py-3 px-4 text-right">Nominal (Rupiah)</th>
                      <th className="py-3 px-4 text-right">Rasio (%)</th>
                      <th className="py-3 px-4 text-left">Keterangan / Dasar Perhitungan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] font-medium">
                    {/* BAGIAN I: PENDAPATAN OPERASIONAL */}
                    <tr className="bg-slate-100/70 font-bold text-[#1D1D1F]">
                      <td colSpan={4} className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-800">
                        I. PENDAPATAN OPERASIONAL JASA ANGKUTAN
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Pendapatan Bruto Nilai Kontrak (ERP 1 + ERP 2)</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#1D1D1F]">
                        {formatCurrency(pnl.revenue.grossContractValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.revenue.grossContractValue / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">
                        Total nilai surat jalan &amp; kontrak pelanggan bulan ini ({pnl.contractsCount} kontrak)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#FF3B30]">Potongan Pajak PPh 23 (2%)</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#FF3B30]">
                        -{formatCurrency(pnl.revenue.taxDeduction)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#FF3B30]">-2.0%</td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Potongan PPh 23 resmi 2% dari nilai bruto kontrak</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Pendapatan Bersih Kontrak Diterima PT (98%)</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#1D1D1F]">
                        {formatCurrency(pnl.revenue.netContractValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">98.0%</td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Hasil bersih tagihan kontrak setelah potong pajak</td>
                    </tr>
                    {pnl.revenue.otherIncome > 0 && (
                      <tr>
                        <td className="py-3 px-4 pl-8 text-[#34C759]">Pendapatan Operasional Lain-lain</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#34C759]">
                          +{formatCurrency(pnl.revenue.otherIncome)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#34C759]">
                          {((pnl.revenue.otherIncome / pnl.revenue.totalNetRevenue) * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Pemasukan di luar kontrak (jasa tambahan/kas)</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50/50 font-bold border-y border-emerald-200">
                      <td className="py-3 px-4 text-emerald-950 uppercase tracking-wide">TOTAL PENDAPATAN BERSIH OPERASIONAL</td>
                      <td className="py-3 px-4 text-right font-mono text-base text-emerald-700">
                        {formatCurrency(pnl.revenue.totalNetRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">100.0%</td>
                      <td className="py-3 px-4 text-[11px] text-emerald-800">
                        Dasar perhitungan laba bersih perusahaan bulan ini
                      </td>
                    </tr>

                    {/* BAGIAN II: BEBAN POKOK PENDAPATAN (BIAYA TRIP LANGSUNG) */}
                    <tr className="bg-slate-100/70 font-bold text-[#1D1D1F]">
                      <td colSpan={4} className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-800">
                        II. BEBAN POKOK PENDAPATAN (BIAYA LANGSUNG TRIP)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Hak Jasa Pengemudi / Supir (53% Nilai Kontrak)</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#FF9500]">
                        {formatCurrency(pnl.directTripCosts.driverShare)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.directTripCosts.driverShare / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Alokasi 53% bruto kepada pengemudi armada</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Beban Tol Armada (Porsi Perusahaan 60%)</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#6E6E73]">
                        {formatCurrency(pnl.directTripCosts.companyToll)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.directTripCosts.companyToll / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Reimburse tol porsi 60% PT &amp; top-up Flazz</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Beban Bahan Bakar Minyak (BBM Solar)</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#6E6E73]">
                        {formatCurrency(pnl.directTripCosts.fuelCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.directTripCosts.fuelCost / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Biaya pengisian solar truk operasional</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Biaya Inap &amp; Operasional Perjalanan Lainnya</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#6E6E73]">
                        {formatCurrency(pnl.directTripCosts.otherTripCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.directTripCosts.otherTripCost / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Biaya timbangan, parkir, dan uang inap supir</td>
                    </tr>
                    <tr className="bg-amber-50/50 font-bold border-y border-amber-200">
                      <td className="py-3 px-4 text-amber-950 uppercase tracking-wide">TOTAL BEBAN POKOK PENDAPATAN (BIAYA TRIP)</td>
                      <td className="py-3 px-4 text-right font-mono text-base text-amber-800">
                        {formatCurrency(pnl.directTripCosts.totalDirectTripCosts)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-800">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.directTripCosts.totalDirectTripCosts / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-amber-900">Total biaya langsung yang dikeluarkan untuk trip</td>
                    </tr>
                    <tr className="bg-blue-50/60 font-black border-y-2 border-blue-200">
                      <td className="py-3.5 px-4 text-blue-950 uppercase tracking-wide">LABA KOTOR OPERASIONAL TRIP (GROSS PROFIT)</td>
                      <td className="py-3.5 px-4 text-right font-mono text-base text-blue-700">
                        {formatCurrency(pnl.grossProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-blue-700 font-bold">
                        {pnl.grossProfitMargin.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-blue-900 font-normal">
                        Pendapatan Bersih dikurangi Biaya Langsung Trip
                      </td>
                    </tr>

                    {/* BAGIAN III: BEBAN OPERASIONAL, PERAWATAN ARMADA & OVERHEAD */}
                    <tr className="bg-slate-100/70 font-bold text-[#1D1D1F]">
                      <td colSpan={4} className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-800">
                        III. BEBAN OPERASIONAL, PERAWATAN ARMADA &amp; OVERHEAD
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Biaya Servis &amp; Perawatan Bengkel Armada</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#6E6E73]">
                        {formatCurrency(pnl.operatingExpenses.maintenance)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.operatingExpenses.maintenance / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Perbaikan truk, ganti oli, filter solar, kelistrikan</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Biaya Ban Armada (Beli &amp; Perbaikan Ban)</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#6E6E73]">
                        {formatCurrency(pnl.operatingExpenses.tires)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.operatingExpenses.tires / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Pembelian ban baru, vulkanisir, dan penanganan pecah ban</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Biaya Suku Cadang &amp; Sparepart</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#6E6E73]">
                        {formatCurrency(pnl.operatingExpenses.spareparts)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.operatingExpenses.spareparts / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Pengadaan komponen dan suku cadang gudang</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Cicilan / Angsuran Leasing Truk (Dipostar)</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#6E6E73]">
                        {formatCurrency(pnl.operatingExpenses.truckLeasing)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.operatingExpenses.truckLeasing / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Pembayaran angsuran pembiayaan leasing truk tronton</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Administrasi Bank, Bi-Fast &amp; Kas Operasional</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#6E6E73]">
                        {formatCurrency(pnl.operatingExpenses.bankAndAdmin)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.operatingExpenses.bankAndAdmin / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Biaya transaksi bank, ATM, Bi-Fast, &amp; tarikan kas</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 pl-8 text-[#1D1D1F]">Beban Operasional Kantor Lainnya</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#6E6E73]">
                        {formatCurrency(pnl.operatingExpenses.officeAndOther)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.operatingExpenses.officeAndOther / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#6E6E73]">Konsumsi, perlengkapan, dan pengeluaran kantor</td>
                    </tr>
                    <tr className="bg-rose-50/50 font-bold border-y border-rose-200">
                      <td className="py-3 px-4 text-rose-950 uppercase tracking-wide">TOTAL BEBAN OPERASIONAL &amp; OVERHEAD</td>
                      <td className="py-3 px-4 text-right font-mono text-base text-rose-700">
                        {formatCurrency(pnl.operatingExpenses.totalOperatingExpenses)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-700">
                        {pnl.revenue.totalNetRevenue > 0 ? ((pnl.operatingExpenses.totalOperatingExpenses / pnl.revenue.totalNetRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-[11px] text-rose-900">Total beban tetap &amp; perawatan armada non-trip</td>
                    </tr>

                    {/* BAGIAN IV: LABA BERSIH OPERASIONAL (NET PROFIT) */}
                    <tr className="bg-gradient-to-r from-emerald-100 to-emerald-50 border-y-2 border-emerald-400 font-black">
                      <td className="py-4 px-4 text-emerald-950 text-sm uppercase tracking-wider">
                        IV. LABA BERSIH BULAN {pnl.periodLabel.toUpperCase()} (NET PROFIT)
                      </td>
                      <td className={`py-4 px-4 text-right font-mono text-lg sm:text-xl font-black ${pnl.netOperatingProfit >= 0 ? 'text-[#248A3D]' : 'text-[#FF3B30]'}`}>
                        {formatCurrency(pnl.netOperatingProfit)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-base font-black text-emerald-900">
                        {pnl.netProfitMargin.toFixed(1)}%
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-emerald-950">
                        Laba bersih setelah semua biaya trip dan overhead
                      </td>
                    </tr>

                    {/* BAGIAN V: ARUS KAS & PIUTANG */}
                    <tr className="bg-slate-100/70 font-bold text-[#1D1D1F]">
                      <td colSpan={4} className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-800">
                        V. RINGKASAN ARUS KAS &amp; PIUTANG KONTRAK
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 pl-8 text-[#1D1D1F]">Pembayaran Masuk Diterima dari Pelanggan (Kas Masuk)</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#34C759]">
                        {formatCurrency(pnl.customerPaymentsReceived)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.grossContractValue > 0 ? ((pnl.customerPaymentsReceived / pnl.revenue.grossContractValue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-[#6E6E73]">Total invoice yang sudah lunas dibayar pelanggan</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 pl-8 text-[#1D1D1F]">Sisa Piutang Kontrak Belum Tertagih</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#FF9500]">
                        {formatCurrency(pnl.outstandingReceivables)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#6E6E73]">
                        {pnl.revenue.grossContractValue > 0 ? ((pnl.outstandingReceivables / pnl.revenue.grossContractValue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-[#6E6E73]">Tagihan invoice kontrak yang masih outstanding</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Toggleable Expense Breakdown Drawer */}
              {pnl.operatingExpenses.breakdownItems && pnl.operatingExpenses.breakdownItems.length > 0 && (
                <div className="border-t border-black/[0.08] bg-[#FAFAFA] p-6 print:hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                        Rincian Transaksi Pengeluaran ({pnl.operatingExpenses.breakdownItems.length} Transaksi Terverifikasi)
                      </h4>
                      <p className="text-[11px] text-[#6E6E73]">
                        Daftar lengkap beban operasional yang dicatat di jurnal keuangan, BCA, dan kas bulan ini.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowExpenseDetails(!showExpenseDetails)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] text-xs font-semibold text-[#1D1D1F] hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                    >
                      <span>{showExpenseDetails ? 'Sembunyikan Rincian' : 'Lihat Rincian Pengeluaran'}</span>
                      {showExpenseDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {showExpenseDetails && (
                    <div className="mt-4 overflow-x-auto bg-white rounded-xl border border-black/[0.08]">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold bg-[#FAFAFA]">
                            <th className="py-2.5 px-3">Tanggal</th>
                            <th className="py-2.5 px-3">Kategori</th>
                            <th className="py-2.5 px-3">Keterangan Transaksi</th>
                            <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.06] font-medium">
                          {pnl.operatingExpenses.breakdownItems.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono text-[#6E6E73]">{item.date}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[#1D1D1F] font-mono text-[11px]">{item.description}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1D1D1F]">
                                {formatCurrency(item.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Official Sign-off Block for Print Mode */}
              <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t-2 border-black/20 text-center text-xs">
                <div>
                  <p className="font-semibold text-gray-700 mb-16">Disetujui Oleh,</p>
                  <p className="font-bold underline text-black">HARIHARTO SURYA ANGESTIONO</p>
                  <p className="text-gray-600">Direktur Utama / Owner</p>
                  <p className="text-gray-500 text-[10px]">PT Panca Utama Cargo</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-16">Dibuat Oleh,</p>
                  <p className="font-bold underline text-black">EMILY BINTANG ANGESTIONO</p>
                  <p className="text-gray-600">Bagian Keuangan / Finance</p>
                  <p className="text-gray-500 text-[10px]">PT Panca Utama Cargo</p>
                </div>
              </div>
            </div>
          )}

          {/* PROFIT TREND CHART & COST BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PROFIT PERFORMANCE CHART */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Tren Pendapatan &amp; Laba Bersih</h3>
                <p className="text-xs text-[#6E6E73]">Perbandingan Pendapatan, Total Biaya, dan Laba Bersih antar bulan.</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-[#6E6E73] pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" /> Pendapatan</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8E8E93]" /> Total Beban</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" /> Laba Bersih</span>
              </div>

              {/* Clean Monthly Bars */}
              <div className="space-y-3 pt-2">
                {data.profitTrend.map((pt: any) => {
                  const maxVal = Math.max(...data.profitTrend.map((p: any) => Math.max(p.revenue, p.cost, Math.abs(p.netProfit))), 1)
                  const revPct = Math.min(100, Math.round((pt.revenue / maxVal) * 100))
                  const costPct = Math.min(100, Math.round((pt.cost / maxVal) * 100))
                  const profPct = Math.min(100, Math.round((Math.max(0, pt.netProfit) / maxVal) * 100))

                  return (
                    <div key={pt.monthKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#6E6E73] font-medium">
                        <span className="font-semibold text-[#1D1D1F]">{pt.label}</span>
                        <div className="space-x-3 text-[11px]">
                          <span>Pendapatan: <strong className="text-[#1D1D1F]">{formatCurrency(pt.revenue)}</strong></span>
                          <span>Beban: <strong className="text-[#6E6E73]">{formatCurrency(pt.cost)}</strong></span>
                          <span>Laba: <strong className="text-[#34C759]">{formatCurrency(pt.netProfit)}</strong></span>
                        </div>
                      </div>
                      <div className="h-3 bg-[#F5F5F7] rounded-full overflow-hidden flex gap-0.5 p-0.5">
                        <div style={{ width: `${revPct}%` }} className="bg-[#007AFF] rounded-full h-full" title={`Pendapatan: ${formatCurrency(pt.revenue)}`} />
                        <div style={{ width: `${costPct}%` }} className="bg-[#8E8E93] rounded-full h-full" title={`Beban: ${formatCurrency(pt.cost)}`} />
                        <div style={{ width: `${profPct}%` }} className="bg-[#34C759] rounded-full h-full" title={`Laba: ${formatCurrency(pt.netProfit)}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* COST BREAKDOWN CARD */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Komposisi Beban Operasional</h3>
                <p className="text-xs text-[#6E6E73]">Struktur biaya operasional armada &amp; perusahaan.</p>
              </div>

              <div className="space-y-4 pt-2 text-xs">
                {[
                  { label: 'Leasing Truk (Dipostar)', amount: s.costBreakdown.leasing || 0, color: 'bg-indigo-600' },
                  { label: 'Ban Armada', amount: s.costBreakdown.tire || 0, color: 'bg-[#34C759]' },
                  { label: 'Tol Armada', amount: s.costBreakdown.toll || 0, color: 'bg-[#007AFF]' },
                  { label: 'Maintenance & Servis', amount: s.costBreakdown.maintenance || 0, color: 'bg-[#5856D6]' },
                  { label: 'BBM Solar', amount: s.costBreakdown.fuel || 0, color: 'bg-[#FF9500]' },
                  { label: 'Administrasi Bank & Kas', amount: s.costBreakdown.adminOffice || 0, color: 'bg-amber-600' },
                  { label: 'Operasional Lainnya', amount: s.costBreakdown.other || 0, color: 'bg-[#8E8E93]' },
                ].map((item) => {
                  const pct = s.totalOperatingCost > 0 ? ((item.amount / s.totalOperatingCost) * 100).toFixed(1) : '0'
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[#1D1D1F] font-medium">
                        <span className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                          {item.label}
                        </span>
                        <span className="font-mono text-[#6E6E73]">{formatCurrency(item.amount)} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className={`h-full ${item.color}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* MONTHLY PERFORMANCE TABLE (12 MONTHS TABLE) */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">RIWAYAT KINERJA BULANAN TAHUN 2026</h3>
                <p className="text-xs text-[#6E6E73]">Performa laba rugi dan ringkasan keuangan per bulan.</p>
              </div>
              <button
                onClick={handleExportCsv}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-black/[0.08] hover:bg-slate-100 text-xs font-semibold text-[#1D1D1F] flex items-center gap-2 transition-colors self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-[#007AFF]" />
                <span>Export CSV 12 Bulan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase tracking-wider bg-[#FAFAFA]">
                    <th className="py-3 px-4">Bulan</th>
                    <th className="py-3 px-4 text-center">Kontrak</th>
                    <th className="py-3 px-4 text-right">Pendapatan Bruto</th>
                    <th className="py-3 px-4 text-right">Hak Supir (53%)</th>
                    <th className="py-3 px-4 text-right">Beban Operasional</th>
                    <th className="py-3 px-4 text-right">Laba Bersih</th>
                    <th className="py-3 px-4 text-right">Margin</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {data.monthlyProfitability.map((m: any) => (
                    <tr
                      key={m.monthKey}
                      className={`hover:bg-[#F5F5F7] transition-colors ${
                        selectedMonthKey === m.monthKey ? 'bg-blue-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">
                        <span className="flex items-center gap-1.5">
                          {m.label}
                          {selectedMonthKey === m.monthKey && (
                            <span className="w-2 h-2 rounded-full bg-[#007AFF]" title="Bulan Aktif Terpilih" />
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {m.contractsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold">{m.contractsCount} trip</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1D1D1F]">
                        {m.grossRevenue > 0 ? formatCurrency(m.grossRevenue) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#FF9500]">
                        {m.driverShare > 0 ? formatCurrency(m.driverShare) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">
                        {m.totalOperatingCost > 0 ? formatCurrency(m.totalOperatingCost) : '-'}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold ${
                          m.netProfit > 0
                            ? 'text-[#34C759]'
                            : m.netProfit < 0
                            ? 'text-[#FF3B30]'
                            : 'text-slate-400'
                        }`}
                      >
                        {m.contractsCount > 0 || m.totalOperatingCost > 0 ? formatCurrency(m.netProfit) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#1D1D1F]">
                        {m.revenue > 0 ? `${m.profitMargin.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'HIGH MARGIN'
                              ? 'bg-[#34C759]/10 text-[#248A3D]'
                              : m.status === 'NORMAL'
                              ? 'bg-[#007AFF]/10 text-[#007AFF]'
                              : m.status === 'LOW MARGIN'
                              ? 'bg-[#FF9500]/10 text-[#C67300]'
                              : m.status === 'LOSS'
                              ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {m.status === 'NO_DATA' ? 'Belum Ada Trip' : m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleMonthChange(m.monthKey)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-black/[0.08] hover:bg-[#007AFF] hover:text-white text-[11px] font-semibold transition-colors"
                            title="Tampilkan rincian Laba Rugi bulan ini"
                          >
                            P&amp;L
                          </button>
                          <button
                            onClick={() => handleDownloadExcel(m.monthKey)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[11px] font-bold transition-colors"
                            title="Download Excel bulan ini"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FLEET PERFORMANCE & CONTRACT PROFITABILITY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FLEET PERFORMANCE */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Performa Armada Truk</h3>
                <p className="text-xs text-[#6E6E73]">Kontribusi laba bersih per unit truk tronton.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase bg-[#FAFAFA]">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Truk / Nopol</th>
                      <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                      <th className="py-2.5 px-3 text-right">Laba / KM</th>
                      <th className="py-2.5 px-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] font-medium">
                    {data.fleetProfitability.slice(0, 5).map((f: any, idx: number) => (
                      <tr key={f.truckId} className="hover:bg-[#F5F5F7]">
                        <td className="py-3 px-3 font-mono font-bold text-[#6E6E73]">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-3">
                          <Link href={`/trucks/${f.truckId}`} className="font-semibold text-[#1D1D1F] hover:underline flex items-center gap-1.5">
                            {f.truckCode} ({f.policeNumber})
                            {idx === 0 && <span className="w-2 h-2 rounded-full bg-[#34C759]" title="Top Truck" />}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#34C759]">
                          {formatCurrency(f.netProfit)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#6E6E73]">
                          {f.profitPerKm ? formatCurrency(Math.round(f.profitPerKm)) : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold">
                          {f.revenue > 0 ? ((f.netProfit / f.revenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOP CUSTOMERS */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Pelanggan Utama</h3>
                <p className="text-xs text-[#6E6E73]">Kontribusi pendapatan dan laba bersih per pelanggan.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase bg-[#FAFAFA]">
                      <th className="py-2.5 px-3">Pelanggan</th>
                      <th className="py-2.5 px-3 text-center">Trip</th>
                      <th className="py-2.5 px-3 text-right">Pendapatan</th>
                      <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                      <th className="py-2.5 px-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] font-medium">
                    {data.customerProfitability.slice(0, 5).map((cust: any) => (
                      <tr key={cust.customerId} className="hover:bg-[#F5F5F7]">
                        <td className="py-3 px-3 font-semibold text-[#1D1D1F]">{cust.customerName}</td>
                        <td className="py-3 px-3 text-center">{cust.contractsCount}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">{formatCurrency(cust.revenue)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#34C759]">{formatCurrency(cust.netProfit)}</td>
                        <td className="py-3 px-3 text-right font-semibold">{cust.profitMargin.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CONTRACT PROFITABILITY TABLE */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Profitabilitas Kontrak &amp; Surat Jalan</h3>
                <p className="text-xs text-[#6E6E73]">Perhitungan margin laba per round-trip perjalanan.</p>
              </div>
              <Link href="/contracts" className="text-xs font-semibold text-[#007AFF] hover:underline">
                Kelola Semua Kontrak &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase bg-[#FAFAFA]">
                    <th className="py-3 px-4">No Kontrak</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Truk</th>
                    <th className="py-3 px-4">Supir</th>
                    <th className="py-3 px-4 text-right">Pendapatan</th>
                    <th className="py-3 px-4 text-right">Total Biaya</th>
                    <th className="py-3 px-4 text-right">Laba Bersih</th>
                    <th className="py-3 px-4 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {data.contractProfitability.slice(0, 10).map((c: any) => (
                    <tr
                      key={c.id}
                      onClick={() => (window.location.href = `/contracts/${c.id}`)}
                      className="hover:bg-[#F5F5F7] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#007AFF]">{c.contractNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">{c.customerName}</td>
                      <td className="py-3.5 px-4 font-mono">{c.truckCode}</td>
                      <td className="py-3.5 px-4">{c.driverName}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1D1D1F]">{formatCurrency(c.totalRevenue)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">{formatCurrency(c.totalCost)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#34C759] text-sm">
                        {formatCurrency(c.netProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#1D1D1F]">{c.profitMargin.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DRIVER PERFORMANCE */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Kinerja Pengemudi / Supir Armada</h3>
              <p className="text-xs text-[#6E6E73]">Alokasi hak supir (53%), uang jalan muka, dan penyelesaian settlement.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase bg-[#FAFAFA]">
                    <th className="py-3 px-4">Nama Supir</th>
                    <th className="py-3 px-4 text-center">Trip</th>
                    <th className="py-3 px-4 text-right">Total Jarak</th>
                    <th className="py-3 px-4 text-right">Pendapatan Bruto</th>
                    <th className="py-3 px-4 text-right">Hak Supir (53%)</th>
                    <th className="py-3 px-4 text-right">Settlement Dibayar</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {data.driverPerformance.map((d: any) => (
                    <tr key={d.driverId} className="hover:bg-[#F5F5F7]">
                      <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">{d.driverName}</td>
                      <td className="py-3.5 px-4 text-center">{d.contractsCount}</td>
                      <td className="py-3.5 px-4 text-right font-mono">{formatKm(d.distanceKm)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold">{formatCurrency(d.revenue)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#FF9500] font-semibold">{formatCurrency(d.driverAllocation)}</td>
                      <td className="py-3.5 px-4 text-right font-mono">{formatCurrency(d.settlementPaid)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'SETTLED'
                              ? 'bg-[#34C759]/10 text-[#248A3D]'
                              : 'bg-[#FF9500]/10 text-[#C67300]'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BUSINESS INSIGHTS */}
          {data.insights && data.insights.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#007AFF]">
                <Sparkles className="w-4 h-4 text-[#007AFF]" />
                <span>Executive Insights &amp; Rekomendasi Bisnis</span>
              </div>
              <div className="space-y-2 pt-1">
                {data.insights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#1D1D1F]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] shrink-0 mt-1.5" />
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
