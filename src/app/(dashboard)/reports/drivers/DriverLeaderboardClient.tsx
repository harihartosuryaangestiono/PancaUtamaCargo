'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import { Trophy, Download, Search, ArrowLeft } from 'lucide-react'

interface LeaderboardItem {
  id: string
  driverCode: string
  name: string
  phone: string | null
  licenseType: string | null
  status: string
  totalContracts: number
  totalKm: number
  totalRevenue: number
  totalDriverAllocation: number
  avgRevenuePerKm: number | null
  outstandingBalance: number
  rank: number
  rankBadge: string
}

interface DriverLeaderboardClientProps {
  leaderboard: LeaderboardItem[]
  currentPeriod: string
}

export function DriverLeaderboardClient({ leaderboard, currentPeriod }: DriverLeaderboardClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'REVENUE' | 'KM' | 'CONTRACTS' | 'ALLOCATION'>('REVENUE')

  function handlePeriodChange(period: string) {
    router.push(`/reports/drivers?period=${period}`)
  }

  const filtered = leaderboard
    .filter((d) => {
      if (search.trim() === '') return true
      const q = search.toLowerCase()
      return d.name.toLowerCase().includes(q) || d.driverCode.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'KM') return b.totalKm - a.totalKm
      if (sortBy === 'CONTRACTS') return b.totalContracts - a.totalContracts
      if (sortBy === 'ALLOCATION') return b.totalDriverAllocation - a.totalDriverAllocation
      return b.totalRevenue - a.totalRevenue
    })

  function handleExportCsv() {
    const headers = ['Rank', 'Kode', 'Nama', 'SIM', 'Total Kontrak', 'Total KM', 'Omset Kontrak', 'Alokasi Supir (53%)', 'Sisa Outstanding']
    const rows = filtered.map((d) => [
      d.rank,
      d.driverCode,
      `"${d.name}"`,
      d.licenseType || 'SIM B2 Umum',
      d.totalContracts,
      d.totalKm,
      d.totalRevenue,
      d.totalDriverAllocation,
      d.outstandingBalance,
    ])

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Leaderboard_Driver_${currentPeriod}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/drivers"
            className="p-2 rounded-xl border border-black/[0.08] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-[#1D1D1F]">
                Leaderboard &amp; Intelijen Performa Pengemudi
              </h2>
              <Trophy className="w-5 h-5 text-[#FF9500]" />
            </div>
            <p className="text-xs text-[#6E6E73]">
              Peringkat pengemudi berdasarkan omset, kontribusi produktivitas, dan jarak tempuh real
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] bg-white border border-black/[0.08] rounded-xl hover:bg-[#F5F5F7] transition-colors flex items-center gap-2 shadow-2xs"
        >
          <Download className="w-4 h-4" />
          Export Laporan CSV
        </button>
      </div>

      {/* Filter Presets & Search */}
      <div className="bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'TODAY', label: 'Hari Ini' },
            { id: 'THIS_WEEK', label: 'Minggu Ini' },
            { id: 'THIS_MONTH', label: 'Bulan Ini' },
            { id: 'LAST_MONTH', label: 'Bulan Lalu' },
            { id: 'LAST_3_MONTHS', label: '3 Bulan' },
            { id: 'THIS_YEAR', label: 'Tahun Ini' },
            { id: 'ALL_TIME', label: 'Semua Waktu' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePeriodChange(preset.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                currentPeriod === preset.id
                  ? 'bg-[#007AFF] text-white shadow-2xs'
                  : 'bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8E8E93]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pengemudi..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 font-medium"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 font-medium"
          >
            <option value="REVENUE">Urutkan: Omset Kontrak</option>
            <option value="KM">Urutkan: Total KM</option>
            <option value="CONTRACTS">Urutkan: Jumlah Kontrak</option>
            <option value="ALLOCATION">Urutkan: Driver Share 53%</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table / Empty State */}
      <div className="bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-[#FF9500] mx-auto mb-3">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#1D1D1F] mb-1">
              Belum Ada Peringkat Pengemudi
            </h3>
            <p className="text-xs text-[#6E6E73] max-w-sm mx-auto">
              Tidak ada data transaksi atau pengemudi terdaftar pada periode ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[#6E6E73] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center">Peringkat</th>
                  <th className="py-3.5 px-4">Pengemudi</th>
                  <th className="py-3.5 px-4 text-center">Total Kontrak</th>
                  <th className="py-3.5 px-4 text-right">Total Jarak (KM)</th>
                  <th className="py-3.5 px-4 text-right">Omset Kontrak</th>
                  <th className="py-3.5 px-4 text-right">Hak Driver (53%)</th>
                  <th className="py-3.5 px-4 text-right">Rata-Rata Rp/KM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3.5 px-4 text-center font-semibold">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          d.rank === 1
                            ? 'bg-amber-100 text-[#C67300]'
                            : d.rank === 2
                            ? 'bg-[#E5E5EA] text-[#1D1D1F]'
                            : d.rank === 3
                            ? 'bg-amber-50 text-[#C67300]'
                            : 'text-[#6E6E73]'
                        }`}
                      >
                        {d.rankBadge}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-center font-semibold text-xs text-[#1D1D1F]">
                          {d.driverCode}
                        </div>
                        <div>
                          <Link
                            href={`/drivers/${d.id}`}
                            className="font-semibold text-[#1D1D1F] hover:text-[#007AFF] transition-colors"
                          >
                            {d.name}
                          </Link>
                          <p className="text-[11px] text-[#6E6E73]">{d.licenseType || 'SIM B2 Umum'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-[#1D1D1F]">
                      {d.totalContracts} Kontrak
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1D1D1F]">
                      {formatKm(d.totalKm)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#248A3D]">
                      {formatCurrency(d.totalRevenue)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#007AFF]">
                      {formatCurrency(d.totalDriverAllocation)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-medium text-[#6E6E73]">
                      {d.avgRevenuePerKm !== null ? `${formatCurrency(d.avgRevenuePerKm)}/KM` : 'Not recorded'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
