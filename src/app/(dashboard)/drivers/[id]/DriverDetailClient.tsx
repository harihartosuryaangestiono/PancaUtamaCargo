'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import {
  User,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Briefcase,
  TrendingUp,
  FileText,
  DollarSign,
  Activity,
  Layers,
} from 'lucide-react'

interface DriverDetailProps {
  driver: {
    id: string
    driverCode: string
    name: string
    phone: string | null
    address: string | null
    licenseNumber: string | null
    licenseType: string | null
    licenseExpiry: string | null
    status: string
    notes: string | null
    createdAt: string
    metrics: {
      activeContractsCount: number
      completedContractsCount: number
      totalContractsCount: number
      totalKm: number
      totalRevenue: number
      totalDriverAllocation: number
      totalAdvances: number
      totalSettled: number
      outstandingBalance: number
      avgRevenuePerContract: number | null
      avgRevenuePerKm: number | null
      avgAllocationPerTrip: number | null
      avgKmPerContract: number | null
      licenseStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'
      daysUntilExpiry: number | null
    }
    contracts: Array<{
      id: string
      contractNumber: string
      truckPoliceNumber: string
      customerName: string
      startDate: string
      status: string
      totalRevenue: number
      driverAllocation: number
      advancesGiven: number
    }>
    erpTrips: Array<{
      id: string
      contractNumber: string
      contractId: string
      legNumber: number
      direction: string
      origin: string
      destination: string
      cargoType: string
      cargoWeightTon: number
      distanceKm: number
      contractValue: number
      driverShare: number
      companyShare: number
      status: string
    }>
    advances: Array<{
      id: string
      contractNumber: string
      contractId: string
      amount: number
      givenAt: string
      status: string
      notes: string | null
      givenByName: string
    }>
    settlements: Array<{
      id: string
      contractNumber: string
      contractId: string
      driverShare: number
      advanceAmount: number
      settlementDifference: number
      resolution: string | null
      status: string
      settlementDate: string
    }>
    ledgerEntries: Array<{
      id: string
      type: string
      amount: number
      date: string
      notes: string | null
      contractNumber: string | null
      createdByName: string
    }>
    activityStream: Array<{
      id: string
      type: string
      title: string
      description: string
      amount?: number
      date: string
      link?: string
    }>
  }
}

export function DriverDetailClient({ driver }: DriverDetailProps) {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'CONTRACTS' | 'ERP_TRIPS' | 'ADVANCES' | 'SETTLEMENTS' | 'PERFORMANCE' | 'ACTIVITY'
  >('OVERVIEW')

  const { metrics } = driver

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/drivers"
            className="p-2 rounded-xl border border-black/[0.08] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1D1D1F]">{driver.name}</h2>
              <span className="px-2.5 py-0.5 rounded-md bg-[#F2F2F7] text-[#1D1D1F] font-mono text-xs font-bold">
                {driver.driverCode}
              </span>
              {driver.status === 'ACTIVE' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20">
                  AKTIF
                </span>
              )}
              {driver.status === 'SUSPENDED' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                  SUSPENDED
                </span>
              )}
            </div>
            <p className="text-xs text-[#6E6E73]">
              {driver.licenseType || 'SIM B2 Umum'} • {driver.phone || 'Tanpa No. Telp'} • {driver.address || 'Tanpa Alamat'}
            </p>
          </div>
        </div>
      </div>

      {/* License Warning Banner */}
      {metrics.licenseStatus === 'EXPIRED' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-[#FF3B30] text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold">PERINGATAN KRITIS: SIM PENGEMUDI SUDAH EXPIRED!</span>
            <p className="text-[11px] opacity-90 mt-0.5">
              Masa berlaku {driver.licenseType || 'SIM'} pengemudi {driver.name} telah habis. Mohon perbarui dokumen SIM sebelum menugaskan kontrak baru.
            </p>
          </div>
        </div>
      )}

      {metrics.licenseStatus === 'EXPIRING_SOON' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-[#C67300] text-xs">
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold">PERINGATAN: SIM PENGEMUDI SEGERA EXPIRED ({metrics.daysUntilExpiry} HARI LAGI)</span>
            <p className="text-[11px] opacity-90 mt-0.5">
              Masa berlaku SIM pengemudi akan habis pada tanggal {new Date(driver.licenseExpiry!).toLocaleDateString('id-ID')}.
            </p>
          </div>
        </div>
      )}

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-medium text-[#6E6E73]">Total Jarak Tempuh</span>
          <p className="text-xl font-bold text-[#1D1D1F] mt-1">{formatKm(metrics.totalKm)}</p>
          <p className="text-[11px] text-[#6E6E73] mt-0.5">{metrics.totalContractsCount} Kontrak Perjalanan</p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-medium text-[#6E6E73]">Total Omset Dihasilkan</span>
          <p className="text-xl font-bold text-[#34C759] mt-1">{formatCurrency(metrics.totalRevenue)}</p>
          <p className="text-[11px] text-[#6E6E73] mt-0.5">Total Kontrak Bruto</p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-medium text-[#6E6E73]">Total Hak Alokasi (53%)</span>
          <p className="text-xl font-bold text-[#007AFF] mt-1">{formatCurrency(metrics.totalDriverAllocation)}</p>
          <p className="text-[11px] text-[#6E6E73] mt-0.5">Pendapatan Bersih Driver</p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-medium text-[#6E6E73]">Sisa Pelunasan Outstanding</span>
          <p className="text-xl font-bold text-[#5856D6] mt-1">{formatCurrency(metrics.outstandingBalance)}</p>
          <p className="text-[11px] text-[#6E6E73] mt-0.5">Alokasi - Uang Jalan</p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#F2F2F7] rounded-2xl overflow-x-auto border border-black/[0.06] no-scrollbar">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'OVERVIEW'
              ? 'bg-white text-[#1D1D1F] shadow-xs border border-black/[0.06]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <User className="w-3.5 h-3.5 text-[#007AFF]" /> Overview Profile
        </button>

        <button
          onClick={() => setActiveTab('CONTRACTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'CONTRACTS'
              ? 'bg-white text-[#1D1D1F] shadow-xs border border-black/[0.06]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-[#007AFF]" /> Riwayat Kontrak ({driver.contracts.length})
        </button>

        <button
          onClick={() => setActiveTab('ERP_TRIPS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'ERP_TRIPS'
              ? 'bg-white text-[#1D1D1F] shadow-xs border border-black/[0.06]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#007AFF]" /> ERP Leg Trips ({driver.erpTrips.length})
        </button>

        <button
          onClick={() => setActiveTab('ADVANCES')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'ADVANCES'
              ? 'bg-white text-[#1D1D1F] shadow-xs border border-black/[0.06]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-[#007AFF]" /> Buku Uang Jalan ({driver.advances.length})
        </button>

        <button
          onClick={() => setActiveTab('SETTLEMENTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'SETTLEMENTS'
              ? 'bg-white text-[#1D1D1F] shadow-xs border border-black/[0.06]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#007AFF]" /> Totalan Supir ({driver.settlements.length})
        </button>

        <button
          onClick={() => setActiveTab('PERFORMANCE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'PERFORMANCE'
              ? 'bg-white text-[#1D1D1F] shadow-xs border border-black/[0.06]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#007AFF]" /> Analytics Kinerja
        </button>

        <button
          onClick={() => setActiveTab('ACTIVITY')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'ACTIVITY'
              ? 'bg-white text-[#1D1D1F] shadow-xs border border-black/[0.06]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-[#007AFF]" /> Timeline Aktivitas ({driver.activityStream.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F] border-b border-black/[0.06] pb-3">
              Informasi Pengemudi &amp; SIM
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#6E6E73] block">Kode Driver</span>
                <span className="font-mono font-semibold text-[#1D1D1F]">{driver.driverCode}</span>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Nama Lengkap</span>
                <span className="font-semibold text-[#1D1D1F]">{driver.name}</span>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Nomor Telepon</span>
                <span className="font-medium text-[#1D1D1F]">{driver.phone || '-'}</span>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Jenis SIM</span>
                <span className="font-medium text-[#1D1D1F]">{driver.licenseType || 'SIM B2 Umum'}</span>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Nomor SIM</span>
                <span className="font-mono font-medium text-[#1D1D1F]">{driver.licenseNumber || '-'}</span>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Masa Berlaku SIM</span>
                <span className="font-medium text-[#1D1D1F]">
                  {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
              <div>
                <span className="text-[#6E6E73] block">Alamat</span>
                <span className="font-medium text-[#1D1D1F]">{driver.address || '-'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">
                Ringkasan Keuangan Driver Ledger
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06]">
                  <span className="text-[#6E6E73] block">Total Hak Driver (53%)</span>
                  <span className="text-base font-semibold text-[#007AFF] mt-1 block">
                    {formatCurrency(metrics.totalDriverAllocation)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06]">
                  <span className="text-[#6E6E73] block">Total Uang Jalan Diberikan</span>
                  <span className="text-base font-semibold text-[#1D1D1F] mt-1 block">
                    {formatCurrency(metrics.totalAdvances)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06]">
                  <span className="text-[#6E6E73] block">Sisa Pelunasan Net</span>
                  <span className="text-base font-semibold text-[#5856D6] mt-1 block">
                    {formatCurrency(metrics.outstandingBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Ratios */}
            <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">
                Rasio Produktivitas &amp; Efisiensi
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06]">
                  <span className="text-[#6E6E73] block">Rata-Rata Pendapatan / Kontrak</span>
                  <span className="text-sm font-semibold text-[#1D1D1F] mt-1 block">
                    {metrics.avgRevenuePerContract !== null ? formatCurrency(metrics.avgRevenuePerContract) : 'Not recorded'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06]">
                  <span className="text-[#6E6E73] block">Rata-Rata Pendapatan / KM</span>
                  <span className="text-sm font-semibold text-[#1D1D1F] mt-1 block">
                    {metrics.avgRevenuePerKm !== null ? `${formatCurrency(metrics.avgRevenuePerKm)} / KM` : 'Not recorded'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTRACTS */}
      {activeTab === 'CONTRACTS' && (
        <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {driver.contracts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6E6E73]">Belum ada kontrak perjalanan yang ditugaskan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[#6E6E73] font-semibold uppercase">
                    <th className="py-3 px-4">No. Kontrak</th>
                    <th className="py-3 px-4">Truk &amp; Pelanggan</th>
                    <th className="py-3 px-4">Tanggal Mulai</th>
                    <th className="py-3 px-4 text-right">Omset Kontrak</th>
                    <th className="py-3 px-4 text-right">Alokasi Driver (53%)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {driver.contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F5F5F7]">
                      <td className="py-3 px-4 font-mono font-semibold text-[#007AFF]">
                        <Link href={`/contracts/${c.id}`}>{c.contractNumber}</Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#1D1D1F]">{c.truckPoliceNumber}</span>
                        <p className="text-[11px] text-[#6E6E73]">{c.customerName}</p>
                      </td>
                      <td className="py-3 px-4 text-[#6E6E73]">
                        {new Date(c.startDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#1D1D1F]">
                        {formatCurrency(c.totalRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#007AFF]">
                        {formatCurrency(c.driverAllocation)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F2F2F7] text-[#1D1D1F]">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ERP TRIPS */}
      {activeTab === 'ERP_TRIPS' && (
        <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {driver.erpTrips.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6E6E73]">Belum ada riwayat pergerakan ERP Leg.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[#6E6E73] font-semibold uppercase">
                    <th className="py-3 px-4">No. Kontrak &amp; Leg</th>
                    <th className="py-3 px-4">Rute (Origin → Destination)</th>
                    <th className="py-3 px-4">Muatan &amp; Berat</th>
                    <th className="py-3 px-4 text-right">Jarak (KM)</th>
                    <th className="py-3 px-4 text-right">Nilai Kontrak</th>
                    <th className="py-3 px-4 text-right">Driver Share (53%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {driver.erpTrips.map((leg) => (
                    <tr key={leg.id} className="hover:bg-[#F5F5F7]">
                      <td className="py-3 px-4 font-mono font-semibold text-[#1D1D1F]">
                        {leg.contractNumber} • ERP {leg.legNumber} ({leg.direction})
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1D1D1F]">
                        {leg.origin} → {leg.destination}
                      </td>
                      <td className="py-3 px-4">
                        <span>{leg.cargoType}</span> ({leg.cargoWeightTon} Ton)
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {formatKm(leg.distanceKm)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {formatCurrency(leg.contractValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#007AFF]">
                        {formatCurrency(leg.driverShare)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ADVANCES */}
      {activeTab === 'ADVANCES' && (
        <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {driver.advances.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6E6E73]">Belum ada riwayat pencatatan Uang Jalan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[#6E6E73] font-semibold uppercase">
                    <th className="py-3 px-4">Kontrak</th>
                    <th className="py-3 px-4">Tanggal Pencatatan</th>
                    <th className="py-3 px-4 text-right">Nominal Uang Jalan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {driver.advances.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F5F5F7]">
                      <td className="py-3 px-4 font-mono font-semibold text-[#007AFF]">
                        <Link href={`/contracts/${a.contractId}`}>{a.contractNumber}</Link>
                      </td>
                      <td className="py-3 px-4 text-[#6E6E73]">
                        {new Date(a.givenAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#1D1D1F]">
                        {formatCurrency(a.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D]">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6E6E73]">{a.givenByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SETTLEMENTS */}
      {activeTab === 'SETTLEMENTS' && (
        <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {driver.settlements.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6E6E73]">Belum ada riwayat totalan supir yang diselesaikan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[#6E6E73] font-semibold uppercase">
                    <th className="py-3 px-4">No. Kontrak</th>
                    <th className="py-3 px-4">Tanggal Totalan</th>
                    <th className="py-3 px-4 text-right">Alokasi Supir</th>
                    <th className="py-3 px-4 text-right">Total Uang Jalan</th>
                    <th className="py-3 px-4 text-right">Selisih Totalan</th>
                    <th className="py-3 px-4 text-center">Resolusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {driver.settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F5F5F7]">
                      <td className="py-3 px-4 font-mono font-semibold text-[#007AFF]">
                        <Link href={`/contracts/${s.contractId}`}>{s.contractNumber}</Link>
                      </td>
                      <td className="py-3 px-4 text-[#6E6E73]">
                        {new Date(s.settlementDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#007AFF]">
                        {formatCurrency(s.driverShare)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#1D1D1F]">
                        {formatCurrency(s.advanceAmount)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          s.settlementDifference >= 0
                            ? 'text-[#34C759]'
                            : 'text-[#FF9500]'
                        }`}
                      >
                        {formatCurrency(s.settlementDifference)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F2F2F7] text-[#1D1D1F]">
                          {s.resolution || 'SETTLED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PERFORMANCE */}
      {activeTab === 'PERFORMANCE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <h4 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-3">Rasio Kontrak &amp; Omset</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-black/[0.06]">
                <span className="text-[#6E6E73]">Rata-Rata Pendapatan / Kontrak</span>
                <span className="font-semibold text-[#1D1D1F]">
                  {metrics.avgRevenuePerContract !== null ? formatCurrency(metrics.avgRevenuePerContract) : 'Not recorded'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/[0.06]">
                <span className="text-[#6E6E73]">Rata-Rata Pendapatan / KM</span>
                <span className="font-semibold text-[#1D1D1F]">
                  {metrics.avgRevenuePerKm !== null ? `${formatCurrency(metrics.avgRevenuePerKm)} / KM` : 'Not recorded'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <h4 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-3">Rasio Jarak &amp; Hak Driver</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-black/[0.06]">
                <span className="text-[#6E6E73]">Rata-Rata Jarak / Kontrak</span>
                <span className="font-semibold text-[#1D1D1F]">
                  {metrics.avgKmPerContract !== null ? formatKm(metrics.avgKmPerContract) : 'Not recorded'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/[0.06]">
                <span className="text-[#6E6E73]">Rata-Rata Hak Alokasi / Trip Leg</span>
                <span className="font-semibold text-[#007AFF]">
                  {metrics.avgAllocationPerTrip !== null ? formatCurrency(metrics.avgAllocationPerTrip) : 'Not recorded'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ACTIVITY */}
      {activeTab === 'ACTIVITY' && (
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {driver.activityStream.length === 0 ? (
            <div className="text-center text-xs text-[#6E6E73] py-6">Belum ada riwayat aktivitas.</div>
          ) : (
            <div className="relative border-l border-black/[0.08] pl-4 space-y-6">
              {driver.activityStream.map((act) => (
                <div key={act.id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#007AFF] ring-4 ring-white" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1D1D1F]">{act.title}</span>
                      <span className="text-[10px] text-[#6E6E73]">{new Date(act.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-xs text-[#6E6E73] mt-0.5">{act.description}</p>
                    {act.amount !== undefined && (
                      <span className="inline-block mt-1 font-mono font-bold text-xs text-[#007AFF]">
                        {formatCurrency(act.amount)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
