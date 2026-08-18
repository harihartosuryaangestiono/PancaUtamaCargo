'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import {
  User,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  Search,
  Plus,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { updateDriverAction, deleteDriverAction } from '@/app/actions/driverActions'
import { CreateDriverModal } from './CreateDriverModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface DriverData {
  id: string
  driverCode: string
  name: string
  phone: string | null
  address: string | null
  licenseNumber: string | null
  licenseType: string | null
  licenseExpiry: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  notes: string | null
  createdAt: string
  activeContracts: number
  totalContracts: number
  totalKm: number
  totalRevenue: number
  totalDriverAllocation: number
  totalAdvances: number
  totalSettled: number
  outstandingBalance: number
  licenseStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'
  daysUntilExpiry: number | null
}

interface DriverClientTableProps {
  drivers: DriverData[]
  userRole: string
}

export function DriverClientTable({ drivers, userRole }: DriverClientTableProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Filtered Drivers
  const filtered = drivers.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false
    if (search.trim() !== '') {
      const q = search.toLowerCase()
      return (
        d.name.toLowerCase().includes(q) ||
        d.driverCode.toLowerCase().includes(q) ||
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Executive Header KPIs
  const totalActive = drivers.filter((d) => d.status === 'ACTIVE').length
  const totalExpiring = drivers.filter((d) => d.licenseStatus === 'EXPIRING_SOON' || d.licenseStatus === 'EXPIRED').length
  const totalAllocation = drivers.reduce((acc, d) => acc + d.totalDriverAllocation, 0)
  const totalOutstanding = drivers.reduce((acc, d) => acc + d.outstandingBalance, 0)

  async function handleToggleStatus(driverId: string, currentStatus: string) {
    let nextStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' = 'ACTIVE'
    if (currentStatus === 'ACTIVE') nextStatus = 'INACTIVE'

    setLoadingId(driverId)
    setError(null)
    const res = await updateDriverAction(driverId, { status: nextStatus })
    setLoadingId(null)

    if (res.error) {
      setError(res.error)
    }
  }

  async function handleConfirmDeleteDriver() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setError(null)
    const res = await deleteDriverAction(deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)

    if (res?.error) {
      setError(res.error)
    }
  }

  async function handleDeleteDriver(driverId: string, driverName: string) {
    setDeleteTarget({ id: driverId, name: driverName })
  }

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeleteDriver}
        title="Hapus Data Pengemudi"
        description={`Apakah Anda yakin ingin menghapus data pengemudi "${deleteTarget?.name}"? Data pengemudi akan dihapus dari sistem.`}
        confirmText="Hapus Pengemudi"
        cancelText="Batal"
        variant="danger"
        loading={deleteLoading}
      />
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <h2 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
            Direktori Pengemudi (Driver Management)
          </h2>
          <p className="text-xs text-[#6E6E73] font-medium mt-1">
            Master data pengemudi, buku kas Uang Jalan, dan intelijen totalan supir
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/reports/drivers"
            className="px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] bg-white border border-black/[0.08] rounded-xl hover:bg-[#F5F5F7] transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            Leaderboard Supir
            <ArrowRight className="w-3.5 h-3.5 text-[#007AFF]" />
          </Link>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Pengemudi
          </button>
        </div>
      </div>

      {/* Header KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#6E6E73]">Pengemudi Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 flex items-center justify-center text-[#248A3D]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[#1D1D1F]">{totalActive} Personel</p>
          <p className="text-[11px] text-[#6E6E73] mt-1">Total {drivers.length} registered drivers</p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#6E6E73]">Peringatan SIM Expired</span>
            <div className="w-8 h-8 rounded-xl bg-[#FF9500]/10 flex items-center justify-center text-[#C67300]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[#FF9500]">{totalExpiring} Pengemudi</p>
          <p className="text-[11px] text-[#6E6E73] mt-1">≤ 30 Hari atau Sudah Expired</p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#6E6E73]">Total Alokasi Supir</span>
            <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-semibold text-[#1D1D1F]">{formatCurrency(totalAllocation)}</p>
          <p className="text-[11px] text-[#6E6E73] mt-1">Hak Driver Share 53% ERP</p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#6E6E73]">Sisa Pelunasan (Outstanding)</span>
            <div className="w-8 h-8 rounded-xl bg-[#5856D6]/10 flex items-center justify-center text-[#5856D6]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-semibold text-[#5856D6]">{formatCurrency(totalOutstanding)}</p>
          <p className="text-[11px] text-[#6E6E73] mt-1">Alokasi minus Uang Jalan</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-[#FF3B30] text-xs font-medium border border-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline">
            Tutup
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8E8E93]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, nama, telepon, atau SIM..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-[#6E6E73] whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-[#1D1D1F] focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/30 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Non-Aktif</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Drivers Table / Empty State */}
      <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#8E8E93] mx-auto mb-4">
              <User className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#1D1D1F] mb-1">
              Belum Ada Data Pengemudi
            </h3>
            <p className="text-xs text-[#6E6E73] max-w-sm mx-auto mb-5">
              Tambahkan pengemudi pertama Anda untuk mulai mencatat kontrak perjalanan, buku kas Uang Jalan, dan pelunasan totalan supir.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengemudi Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[#6E6E73] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Pengemudi</th>
                  <th className="py-3.5 px-4">SIM &amp; Expiry</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Kontrak</th>
                  <th className="py-3.5 px-4 text-right">Total KM</th>
                  <th className="py-3.5 px-4 text-right">Alokasi Supir</th>
                  <th className="py-3.5 px-4 text-right">Sisa Outstanding</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-center text-[#1D1D1F] font-bold text-xs shrink-0">
                          {d.driverCode}
                        </div>
                        <div>
                          <Link
                            href={`/drivers/${d.id}`}
                            className="font-semibold text-[#1D1D1F] hover:text-[#007AFF] transition-colors"
                          >
                            {d.name}
                          </Link>
                          {d.phone && (
                            <p className="text-[11px] text-[#6E6E73] flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-[#8E8E93]" />
                              {d.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-[#1D1D1F]">
                          {d.licenseType || 'SIM B2 Umum'}
                        </p>
                        <p className="text-[11px] text-[#6E6E73] font-mono">
                          {d.licenseNumber || '-'}
                        </p>
                        {d.licenseStatus === 'EXPIRED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF3B30] mt-1">
                            <AlertTriangle className="w-3 h-3" /> EXPIRED
                          </span>
                        )}
                        {d.licenseStatus === 'EXPIRING_SOON' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF9500] mt-1">
                            <Clock className="w-3 h-3" /> Expired dalam {d.daysUntilExpiry} hari
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {d.status === 'ACTIVE' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20">
                          AKTIF
                        </span>
                      )}
                      {d.status === 'INACTIVE' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F2F2F7] text-[#6E6E73] border border-black/[0.06]">
                          NON-AKTIF
                        </span>
                      )}
                      {d.status === 'SUSPENDED' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                          SUSPENDED
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-[#1D1D1F]">{d.activeContracts} Aktif</span>
                      <p className="text-[11px] text-[#6E6E73]">{d.totalContracts} Total</p>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1D1D1F]">
                      {formatKm(d.totalKm)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#007AFF]">
                      {formatCurrency(d.totalDriverAllocation)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#5856D6]">
                      {formatCurrency(d.outstandingBalance)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/drivers/${d.id}`}
                          className="p-1.5 text-[#6E6E73] hover:text-[#007AFF] hover:bg-[#F5F5F7] rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(d.id, d.status)}
                          disabled={loadingId === d.id}
                          className="p-1.5 text-[#6E6E73] hover:text-[#FF9500] hover:bg-[#F5F5F7] rounded-lg transition-colors disabled:opacity-50"
                          title={d.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {userRole === 'OWNER' && (
                          <button
                            onClick={() => handleDeleteDriver(d.id, d.name)}
                            disabled={loadingId === d.id}
                            className="p-1.5 text-[#FF3B30] hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Hapus Pengemudi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateDriverModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}
