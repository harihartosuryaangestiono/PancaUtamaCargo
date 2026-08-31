'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import { withdrawDriverSavingsAction, depositDriverSavingsAction } from '@/app/actions/driverActions'
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
  Shield,
  PiggyBank,
  PlusCircle,
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
      totalSavingsDeposit?: number
      totalSavingsWithdraw?: number
      currentSavingsBalance?: number
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
      paidAmount?: number
      savingsAmount?: number
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
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'CONTRACTS' | 'ERP_TRIPS' | 'ADVANCES' | 'SETTLEMENTS' | 'SAVINGS' | 'PERFORMANCE' | 'ACTIVITY'
  >('OVERVIEW')

  const [isSavingsWithdrawModalOpen, setIsSavingsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNotes, setWithdrawNotes] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  const [isSavingsDepositModalOpen, setIsSavingsDepositModalOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositNotes, setDepositNotes] = useState('')
  const [depositLoading, setDepositLoading] = useState(false)
  const [depositError, setDepositError] = useState<string | null>(null)

  const { metrics } = driver

  async function handleDepositSavings() {
    try {
      setDepositLoading(true)
      setDepositError(null)

      const amount = Number(depositAmount)
      if (!amount || amount <= 0) {
        setDepositError('Nominal simpanan harus lebih besar dari 0.')
        return
      }

      const res = await depositDriverSavingsAction({
        driverId: driver.id,
        amount,
        notes: depositNotes || 'Set Saldo Awal / Deposit Simpanan Supir Manual',
      })

      if (res?.error) {
        setDepositError(res.error)
        return
      }

      setIsSavingsDepositModalOpen(false)
      setDepositAmount('')
      setDepositNotes('')
      router.refresh()
      window.location.reload()
    } catch (err: any) {
      setDepositError(err.message || 'Gagal menambahkan simpanan supir.')
    } finally {
      setDepositLoading(false)
    }
  }

  async function handleWithdrawSavings() {
    try {
      setWithdrawLoading(true)
      setWithdrawError(null)

      const amount = Number(withdrawAmount)
      if (!amount || amount <= 0) {
        setWithdrawError('Nominal penarikan harus lebih besar dari 0.')
        return
      }

      const res = await withdrawDriverSavingsAction({
        driverId: driver.id,
        amount,
        notes: withdrawNotes,
      })

      if (res?.error) {
        setWithdrawError(res.error)
        return
      }

      setIsSavingsWithdrawModalOpen(false)
      setWithdrawAmount('')
      setWithdrawNotes('')
      router.refresh()
      window.location.reload()
    } catch (err: any) {
      setWithdrawError(err.message || 'Gagal memproses penarikan simpanan.')
    } finally {
      setWithdrawLoading(false)
    }
  }

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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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

        <div className="bg-white border border-[#007AFF]/20 bg-[#F0F7FF] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,122,255,0.06)]">
          <span className="text-xs font-semibold text-[#007AFF]">Simpanan Supir (Tabungan)</span>
          <p className="text-xl font-bold text-[#007AFF] mt-1">{formatCurrency(metrics.currentSavingsBalance || 0)}</p>
          <p className="text-[11px] text-[#6E6E73] mt-0.5">Cadangan Kecelakaan/Terpal</p>
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
          onClick={() => setActiveTab('SAVINGS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'SAVINGS'
              ? 'bg-white text-[#1D1D1F] shadow-xs border border-black/[0.06]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5 text-[#007AFF]" /> Simpanan &amp; Tabungan ({formatCurrency(metrics.currentSavingsBalance || 0)})
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

      {/* TAB 5: SAVINGS */}
      {activeTab === 'SAVINGS' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <span className="text-[#6E6E73] font-medium block">Total Simpanan Terkumpul</span>
              <span className="text-xl font-bold text-[#007AFF] mt-1 block">
                {formatCurrency(metrics.totalSavingsDeposit || 0)}
              </span>
              <p className="text-[11px] text-[#6E6E73] mt-1">Hasil Alokasi Pelunasan Totalan</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <span className="text-[#6E6E73] font-medium block">Total Simpanan Terpakai / Klaim</span>
              <span className="text-xl font-bold text-[#FF9500] mt-1 block">
                {formatCurrency(metrics.totalSavingsWithdraw || 0)}
              </span>
              <p className="text-[11px] text-[#6E6E73] mt-1">Klaim Terpal/Kecelakaan</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <span className="text-[#6E6E73] font-medium block">Saldo Simpanan Supir Saat Ini</span>
                <span className="text-xl font-bold text-[#34C759] mt-1 block">
                  {formatCurrency(metrics.currentSavingsBalance || 0)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button
                  onClick={() => setIsSavingsDepositModalOpen(true)}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-[#34C759] hover:bg-[#248A3D] text-white font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Set Saldo Awal / Tambah
                </button>
                <button
                  onClick={() => setIsSavingsWithdrawModalOpen(true)}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-[#FF9500] hover:bg-[#E08200] text-white font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <PiggyBank className="w-3.5 h-3.5" /> Tarik / Gunakan
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Entries Table */}
          <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="p-4 border-b border-black/[0.06] flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                Mutasi Buku Besar Simpanan Supir
              </h4>
            </div>
            {driver.ledgerEntries.filter(
              (le) => le.type === 'DRIVER_SAVINGS_DEPOSIT' || le.type === 'DRIVER_SAVINGS_WITHDRAW'
            ).length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6E6E73]">
                Belum ada riwayat mutasi simpanan supir.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[#6E6E73] font-semibold uppercase">
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Jenis Transaksi</th>
                      <th className="py-3 px-4">Keterangan / Ref</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                      <th className="py-3 px-4">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] font-medium">
                    {driver.ledgerEntries
                      .filter(
                        (le) => le.type === 'DRIVER_SAVINGS_DEPOSIT' || le.type === 'DRIVER_SAVINGS_WITHDRAW'
                      )
                      .map((le) => (
                        <tr key={le.id} className="hover:bg-[#F5F5F7]">
                          <td className="py-3 px-4 text-[#6E6E73]">
                            {new Date(le.date).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3 px-4">
                            {le.type === 'DRIVER_SAVINGS_DEPOSIT' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D]">
                                DEPOSIT SIMPANAN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#FF9500]">
                                PENARIKAN / KLAIM
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#1D1D1F]">
                            {le.notes || '-'}
                            {le.contractNumber && (
                              <span className="text-[#007AFF] ml-1">({le.contractNumber})</span>
                            )}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono font-bold ${
                              le.type === 'DRIVER_SAVINGS_DEPOSIT' ? 'text-[#34C759]' : 'text-[#FF3B30]'
                            }`}
                          >
                            {le.type === 'DRIVER_SAVINGS_DEPOSIT' ? '+' : '-'}
                            {formatCurrency(le.amount)}
                          </td>
                          <td className="py-3 px-4 text-[#6E6E73]">{le.createdByName}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SETTLEMENTS */}
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
                    <th className="py-3 px-4 text-right">Simpanan Supir</th>
                    <th className="py-3 px-4 text-right">Dibayar Tunai</th>
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
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#007AFF]">
                        {formatCurrency(s.savingsAmount || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#34C759]">
                        {formatCurrency(s.paidAmount || 0)}
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

      {/* TAB 7: PERFORMANCE */}
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

      {/* TAB 8: ACTIVITY */}
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

      {/* Withdraw Savings Modal */}
      {isSavingsWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-black/[0.08] shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-semibold text-[#1D1D1F]">Catat Tarik / Gunakan Simpanan Supir</h3>
            <p className="text-xs text-[#6E6E73]">
              Gunakan fitur ini saat ada pengeluaran klaim kecelakaan, terpal rusak/hilang, atau pencairan simpanan untuk {driver.name}.
            </p>
            {withdrawError && <p className="text-xs text-[#FF3B30] font-semibold">{withdrawError}</p>}
            
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Nominal Penarikan / Klaim (Rp)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="misal: 150000"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs font-bold text-[#1D1D1F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Keterangan / Alasan Klaim</label>
              <textarea
                value={withdrawNotes}
                onChange={(e) => setWithdrawNotes(e.target.value)}
                placeholder="misal: Ganti terpal rusak saat perjalanan Semarang - Jakarta"
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs font-medium text-[#1D1D1F]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSavingsWithdrawModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F7] text-[#1D1D1F]"
              >
                Batal
              </button>
              <button
                onClick={handleWithdrawSavings}
                disabled={withdrawLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#007AFF] text-white"
              >
                {withdrawLoading ? 'Simpan...' : 'Simpan Penarikan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit / Set Saldo Awal Simpanan Modal */}
      {isSavingsDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-black/[0.08] shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-semibold text-[#1D1D1F]">Set Saldo Awal / Deposit Simpanan Supir</h3>
            <p className="text-xs text-[#6E6E73]">
              Masukkan nominal modal simpanan awal atau deposit manual untuk {driver.name}.
            </p>
            {depositError && <p className="text-xs text-[#FF3B30] font-semibold">{depositError}</p>}
            
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Nominal Simpanan (Rp)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="misal: 500000"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs font-bold text-[#34C759]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Keterangan / Catatan</label>
              <textarea
                value={depositNotes}
                onChange={(e) => setDepositNotes(e.target.value)}
                placeholder="misal: Saldo tabungan supir dari pembukuan terdahulu"
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs font-medium text-[#1D1D1F]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSavingsDepositModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F7] text-[#1D1D1F]"
              >
                Batal
              </button>
              <button
                onClick={handleDepositSavings}
                disabled={depositLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#34C759] text-white"
              >
                {depositLoading ? 'Menyimpan...' : 'Simpan Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
