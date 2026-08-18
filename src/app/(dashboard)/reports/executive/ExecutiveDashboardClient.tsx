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
  ChevronRight,
  AlertCircle,
  CheckCircle2,
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
  const [loading, setLoading] = useState(false)

  const handlePeriodChange = async (newPeriod: PeriodFilter, start?: string, end?: string) => {
    setPeriod(newPeriod)
    setLoading(true)
    try {
      const { getExecutiveDashboardAction } = await import('@/app/actions/executiveActions')
      const updated = await getExecutiveDashboardAction(newPeriod, start || customStart, end || customEnd)
      setData(updated)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      const { exportExecutiveReportAction } = await import('@/app/actions/executiveActions')
      const res = await exportExecutiveReportAction(period, customStart, customEnd)
      if (res.success) {
        const blob = new Blob([res.files.monthlyProfitabilityCsv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Executive_Monthly_Profitability_${period}_${Date.now()}.csv`
        a.click()
      }
    } catch (err) {
      console.error('Failed to export CSV:', err)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const s = data.summary
  const isDataEmpty = s.totalContracts === 0

  // Time-based Greeting
  const currentHour = new Date().getHours()
  let timeGreeting = 'Good evening'
  if (currentHour < 12) timeGreeting = 'Good morning'
  else if (currentHour < 18) timeGreeting = 'Good afternoon'

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 p-6 sm:p-8 lg:p-10 font-sans text-[#1D1D1F] bg-[#F5F5F7] min-h-screen">
      {/* SECTION 5: HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.08] print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            {timeGreeting}, Hariharto
          </h1>
          <p className="text-xs text-[#6E6E73] font-medium mt-1 flex items-center gap-2">
            <span>Executive Business Overview</span>
            <span className="text-black/20">•</span>
            <span>{formattedDate}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter Dropdown */}
          <div className="relative inline-block">
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as PeriodFilter)}
              className="appearance-none bg-white text-[#1D1D1F] text-xs font-semibold px-4 py-2.5 pr-8 rounded-xl border border-black/[0.08] shadow-2xs hover:bg-[#FAFAFA] transition-all cursor-pointer outline-none"
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="LAST_3_MONTHS">Last 3 Months</option>
              <option value="THIS_YEAR">This Year</option>
              <option value="ALL_TIME">All Time</option>
              <option value="CUSTOM">Custom Range</option>
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
              <span className="text-[#6E6E73]">to</span>
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
                Apply
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-white text-[#1D1D1F] hover:bg-[#FAFAFA] border border-black/[0.08] rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-[#007AFF]" />
            Export Report
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* PRINTABLE HEADER FOR PRINT MODE */}
      <div className="hidden print:block mb-6 border-b border-black/10 pb-4">
        <h1 className="text-2xl font-bold text-black">PANCA UTAMA CARGO — EXECUTIVE BRIEFING REPORT</h1>
        <p className="text-xs text-slate-600">Period: {period} · Generated on {formattedDate}</p>
      </div>

      {/* SECTION 18: EMPTY STATE IF DATABASE HAS ZERO CONTRACTS */}
      {isDataEmpty ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-12 text-center space-y-4 max-w-2xl mx-auto my-12">
          <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">Your business dashboard is ready.</h3>
            <p className="text-xs text-[#6E6E73] mt-1 max-w-md mx-auto">
              Start by recording your first contract, shipment, fuel transaction or expense to generate live executive intelligence.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/contracts"
              className="px-5 py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-xl text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Contract
            </Link>
            <Link
              href="/trucks"
              className="px-5 py-2.5 bg-white text-[#1D1D1F] hover:bg-[#FAFAFA] border border-black/[0.08] rounded-xl text-xs font-semibold shadow-2xs transition-all inline-flex items-center gap-2"
            >
              <TruckIcon className="w-4 h-4 text-[#6E6E73]" /> Add Truck
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 8: PROFIT HERO SECTION */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              {/* Left Hero Focus: NET PROFIT */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#6E6E73] tracking-widest uppercase block">
                  NET PROFIT (Laba Bersih PT)
                </span>
                <div className="flex flex-wrap items-baseline gap-4">
                  <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1D1D1F]">
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
                      {s.profitGrowthPct.toFixed(1)}% vs previous period
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6E6E73]">
                  Calculated from Company Share (47%) minus total fleet operating expenses.
                </p>
              </div>

              {/* Right Sub-metrics Grid */}
              <div className="grid grid-cols-3 gap-6 pt-4 lg:pt-0 lg:border-l border-black/[0.08] lg:pl-8">
                <div>
                  <span className="text-[11px] font-medium text-[#6E6E73] block mb-1">Total Revenue</span>
                  <p className="text-xl font-semibold text-[#1D1D1F]">{formatCurrency(s.totalRevenue)}</p>
                  <span className="text-[10px] text-[#6E6E73]">98% Net Received</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-[#6E6E73] block mb-1">Operating Cost</span>
                  <p className="text-xl font-semibold text-[#1D1D1F]">{formatCurrency(s.totalOperatingCost)}</p>
                  <span className="text-[10px] text-[#6E6E73]">Fuel, Toll, Service</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-[#6E6E73] block mb-1">Profit Margin</span>
                  <p className="text-xl font-semibold text-[#34C759]">{s.profitMargin.toFixed(1)}%</p>
                  <span className="text-[10px] text-[#6E6E73]">Net Profit / Revenue</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: 4 CLEAN KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CARD 1: REVENUE */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-2 hover:-translate-y-[1px] transition-all duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6E73]">
                <span>Revenue</span>
                {s.revenueGrowthPct !== null && (
                  <span className={`font-semibold ${s.revenueGrowthPct >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {s.revenueGrowthPct >= 0 ? '+' : ''}{s.revenueGrowthPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">{formatCurrency(s.totalRevenue)}</p>
              <span className="text-[10px] text-[#6E6E73] block">Gross: {formatCurrency(s.grossRevenue)}</span>
            </div>

            {/* CARD 2: OPERATING COST */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-2 hover:-translate-y-[1px] transition-all duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6E73]">
                <span>Operating Cost</span>
                {s.costGrowthPct !== null && (
                  <span className={`font-semibold ${s.costGrowthPct <= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {s.costGrowthPct >= 0 ? '+' : ''}{s.costGrowthPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">{formatCurrency(s.totalOperatingCost)}</p>
              <span className="text-[10px] text-[#6E6E73] block">Fuel, Toll, Maintenance &amp; Tires</span>
            </div>

            {/* CARD 3: NET PROFIT */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-2 hover:-translate-y-[1px] transition-all duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6E73]">
                <span>Net Profit</span>
                {s.profitGrowthPct !== null && (
                  <span className={`font-semibold ${s.profitGrowthPct >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {s.profitGrowthPct >= 0 ? '+' : ''}{s.profitGrowthPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className={`text-2xl font-semibold tracking-tight ${s.netProfit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                {formatCurrency(s.netProfit)}
              </p>
              <span className="text-[10px] text-[#6E6E73] block">Net Company Contribution</span>
            </div>

            {/* CARD 4: PROFIT MARGIN */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-2 hover:-translate-y-[1px] transition-all duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6E73]">
                <span>Profit Margin</span>
                {s.marginGrowthPts !== null && (
                  <span className={`font-semibold ${s.marginGrowthPts >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {s.marginGrowthPts >= 0 ? '+' : ''}{s.marginGrowthPts.toFixed(1)} pts
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">{s.profitMargin.toFixed(1)}%</p>
              <span className="text-[10px] text-[#6E6E73] block">Efficiency ratio</span>
            </div>
          </div>

          {/* SECTION 9 & 12: PROFIT TREND CHART & COST BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SECTION 9: PROFIT PERFORMANCE CHART */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Profit Performance</h3>
                <p className="text-xs text-[#6E6E73]">Revenue, operating cost and net profit over time.</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-[#6E6E73] pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8E8E93]" /> Operating Cost</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" /> Net Profit</span>
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
                          <span>Rev: <strong className="text-[#1D1D1F]">{formatCurrency(pt.revenue)}</strong></span>
                          <span>Cost: <strong className="text-[#6E6E73]">{formatCurrency(pt.cost)}</strong></span>
                          <span>Net: <strong className="text-[#34C759]">{formatCurrency(pt.netProfit)}</strong></span>
                        </div>
                      </div>
                      <div className="h-3 bg-[#F5F5F7] rounded-full overflow-hidden flex gap-0.5 p-0.5">
                        <div style={{ width: `${revPct}%` }} className="bg-[#007AFF] rounded-full h-full" />
                        <div style={{ width: `${costPct}%` }} className="bg-[#8E8E93] rounded-full h-full" />
                        <div style={{ width: `${profPct}%` }} className="bg-[#34C759] rounded-full h-full" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SECTION 12: COST BREAKDOWN */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Operating Cost</h3>
                <p className="text-xs text-[#6E6E73]">Clean expense category breakdown.</p>
              </div>

              <div className="space-y-4 pt-2 text-xs">
                {[
                  { label: 'Fuel', amount: s.costBreakdown.fuel, color: 'bg-[#FF9500]' },
                  { label: 'Toll', amount: s.costBreakdown.toll, color: 'bg-[#007AFF]' },
                  { label: 'Maintenance', amount: s.costBreakdown.maintenance, color: 'bg-[#5856D6]' },
                  { label: 'Sparepart', amount: s.costBreakdown.sparepart, color: 'bg-[#AF52DE]' },
                  { label: 'Tire', amount: s.costBreakdown.tire, color: 'bg-[#34C759]' },
                  { label: 'Other', amount: s.costBreakdown.other, color: 'bg-[#8E8E93]' },
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

          {/* SECTION 10: MONTHLY PERFORMANCE TABLE */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">MONTHLY PERFORMANCE</h3>
              <p className="text-xs text-[#6E6E73]">Company net profit breakdown month over month.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase tracking-wider bg-[#FAFAFA]">
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Revenue</th>
                    <th className="py-3 px-4 text-right">Hak Supir (53%)</th>
                    <th className="py-3 px-4 text-right">Hak PT (47%)</th>
                    <th className="py-3 px-4 text-right">Operating Cost</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                    <th className="py-3 px-4 text-right">Margin</th>
                    <th className="py-3 px-4 text-center">Contracts</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {data.monthlyProfitability.map((m: any) => (
                    <tr key={m.monthKey} className="hover:bg-[#F5F5F7] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">{m.label}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1D1D1F]">{formatCurrency(m.revenue)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#FF9500]">{formatCurrency(m.driverShare)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#007AFF]">{formatCurrency(m.companyShare)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">{formatCurrency(m.totalOperatingCost)}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${m.netProfit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                        {formatCurrency(m.netProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#1D1D1F]">{m.profitMargin.toFixed(1)}%</td>
                      <td className="py-3.5 px-4 text-center">{m.contractsCount}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'HIGH MARGIN'
                              ? 'bg-[#34C759]/10 text-[#248A3D]'
                              : m.status === 'NORMAL'
                              ? 'bg-[#007AFF]/10 text-[#007AFF]'
                              : m.status === 'LOW MARGIN'
                              ? 'bg-[#FF9500]/10 text-[#C67300]'
                              : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 13 & 14: FLEET PERFORMANCE & CONTRACT PROFITABILITY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SECTION 13: FLEET PERFORMANCE (TOP TRUCKS) */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Fleet Performance</h3>
                <p className="text-xs text-[#6E6E73]">Top performing trucks by net contribution.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase bg-[#FAFAFA]">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Truck / Plat</th>
                      <th className="py-2.5 px-3 text-right">Net Profit</th>
                      <th className="py-2.5 px-3 text-right">Profit / KM</th>
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

            {/* SECTION 15: TOP CUSTOMERS */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Top Customers</h3>
                <p className="text-xs text-[#6E6E73]">Customer revenue &amp; profit contributions.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase bg-[#FAFAFA]">
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3 text-center">Contracts</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                      <th className="py-2.5 px-3 text-right">Net Profit</th>
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

          {/* SECTION 14: CONTRACT PROFITABILITY TABLE */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Contract Profitability</h3>
                <p className="text-xs text-[#6E6E73]">Round-trip contract economics and margins.</p>
              </div>
              <Link href="/contracts" className="text-xs font-semibold text-[#007AFF] hover:underline">
                View All Contracts &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase bg-[#FAFAFA]">
                    <th className="py-3 px-4">Contract</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Truck</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4 text-right">Revenue</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
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

          {/* SECTION 16: DRIVER PERFORMANCE */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Driver Performance</h3>
              <p className="text-xs text-[#6E6E73]">Enterprise driver trips, share allocations &amp; settlements.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[11px] text-[#6E6E73] font-semibold uppercase bg-[#FAFAFA]">
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4 text-center">Contracts</th>
                    <th className="py-3 px-4 text-right">Distance</th>
                    <th className="py-3 px-4 text-right">Revenue</th>
                    <th className="py-3 px-4 text-right">Driver Share (53%)</th>
                    <th className="py-3 px-4 text-right">Settlement</th>
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

          {/* SECTION 17: BUSINESS INSIGHTS */}
          {data.insights && data.insights.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#007AFF]">
                <Sparkles className="w-4 h-4 text-[#007AFF]" />
                <span>Business Insights</span>
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
