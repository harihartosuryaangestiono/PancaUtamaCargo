'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  DollarSign,
  Search,
  Filter,
  ArrowRight,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Truck,
} from 'lucide-react'
import { RecordPaymentModal } from './RecordPaymentModal'
import { EditPaymentStatusModal } from './EditPaymentStatusModal'
import { Edit3 } from 'lucide-react'

interface PiutangClientTableProps {
  initialContracts: any[]
  summary: {
    totalPiutangOutstanding: number
    totalPaidAmount: number
    totalRevenueAll: number
    unpaidCount: number
    partialCount: number
    paidCount: number
    totalContracts: number
  }
  customers: Array<{ id: string; name: string }>
}

export function PiutangClientTable({ initialContracts, summary, customers }: PiutangClientTableProps) {
  const [contracts] = useState<any[]>(initialContracts)
  const [search, setSearch] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL_PIUTANG')

  // Selected contract for modals
  const [selectedContract, setSelectedContract] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const [selectedEditContract, setSelectedEditContract] = useState<any | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)

  // Filtering
  const filteredContracts = contracts.filter((c) => {
    if (selectedCustomerId !== 'ALL' && c.customerId !== selectedCustomerId) return false

    if (statusFilter === 'ALL_PIUTANG') {
      if (c.remainingPiutang <= 0) return false
    } else if (statusFilter !== 'ALL') {
      if (c.paymentStatus !== statusFilter) return false
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const matchNum = c.contractNumber?.toLowerCase().includes(q)
      const matchCust = c.customer?.name?.toLowerCase().includes(q)
      const matchTruck = c.truck?.policeNumber?.toLowerCase().includes(q)
      const matchDriver = c.driverName?.toLowerCase().includes(q)
      if (!matchNum && !matchCust && !matchTruck && !matchDriver) return false
    }

    return true
  })

  function openPaymentModal(contract: any) {
    setSelectedContract(contract)
    setIsModalOpen(true)
  }

  function openEditModal(contract: any) {
    setSelectedEditContract(contract)
    setIsEditModalOpen(true)
  }


  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Piutang Outstanding */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 space-y-1 hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between text-[#FF3B30]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Total Piutang Belum Lunas</span>
            <AlertCircle className="w-5 h-5 text-[#FF3B30]" />
          </div>
          <p className="text-2xl font-black text-[#FF3B30] tracking-tight mt-1">
            {formatCurrency(summary.totalPiutangOutstanding)}
          </p>
          <p className="text-[11px] text-[#6E6E73] font-medium">
            Dari {summary.unpaidCount + summary.partialCount} kontrak angkutan
          </p>
        </div>

        {/* Card 2: Total Uang Masuk Received */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 space-y-1 hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between text-[#34C759]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Total Uang Masuk Received</span>
            <CheckCircle className="w-5 h-5 text-[#34C759]" />
          </div>
          <p className="text-2xl font-black text-[#34C759] tracking-tight mt-1">
            {formatCurrency(summary.totalPaidAmount)}
          </p>
          <p className="text-[11px] text-[#6E6E73] font-medium">
            Total penerimaan kas dari kontrak
          </p>
        </div>

        {/* Card 3: Belum Dibayar (UNPAID) */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 space-y-1 hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between text-[#FF9500]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Belum Dibayar sama sekali</span>
            <Clock className="w-5 h-5 text-[#FF9500]" />
          </div>
          <p className="text-2xl font-black text-[#1D1D1F] tracking-tight mt-1">
            {summary.unpaidCount} <span className="text-sm font-normal text-[#6E6E73]">Kontrak</span>
          </p>
          <p className="text-[11px] text-[#FF9500] font-semibold">
            Status: UNPAID (Perlu ditagih)
          </p>
        </div>

        {/* Card 4: Dibayar Sebagian (PARTIAL) */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 space-y-1 hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between text-[#007AFF]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Dibayar Sebagian (DP/Cicilan)</span>
            <DollarSign className="w-5 h-5 text-[#007AFF]" />
          </div>
          <p className="text-2xl font-black text-[#1D1D1F] tracking-tight mt-1">
            {summary.partialCount} <span className="text-sm font-normal text-[#6E6E73]">Kontrak</span>
          </p>
          <p className="text-[11px] text-[#007AFF] font-semibold">
            Status: PARTIAL (Memiliki sisa)
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. kontrak, customer, nopol..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Customer Filter */}
          <div className="flex items-center gap-1.5 bg-[#F5F5F7] px-3 py-1.5 rounded-xl border border-black/[0.08]">
            <User className="w-3.5 h-3.5 text-[#8E8E93]" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#1D1D1F] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Pelanggan</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl border border-black/[0.08]">
            <button
              onClick={() => setStatusFilter('ALL_PIUTANG')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'ALL_PIUTANG' ? 'bg-white text-[#FF3B30] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Belum Lunas ({summary.unpaidCount + summary.partialCount})
            </button>
            <button
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'UNPAID' ? 'bg-white text-[#FF9500] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Unpaid ({summary.unpaidCount})
            </button>
            <button
              onClick={() => setStatusFilter('PARTIAL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'PARTIAL' ? 'bg-white text-[#007AFF] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Partial ({summary.partialCount})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'PAID' ? 'bg-white text-[#34C759] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Lunas ({summary.paidCount})
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'ALL' ? 'bg-white text-[#1D1D1F] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Semua
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-[#34C759] mx-auto" />
            <h4 className="text-sm font-bold text-[#1D1D1F]">Tidak Ada Piutang Ditemukan</h4>
            <p className="text-xs text-[#6E6E73]">
              Semua tagihan kontrak sesuai kriteria pencarian dan filter sudah lunas atau belum ada transaksi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFAFA] text-[#6E6E73] uppercase tracking-wider font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">No. Kontrak / Tanggal</th>
                  <th className="py-3.5 px-4">Pelanggan (Customer)</th>
                  <th className="py-3.5 px-4">Armada &amp; Supir</th>
                  <th className="py-3.5 px-4 text-right">Nilai Kontrak</th>
                  <th className="py-3.5 px-4 text-right">Uang Masuk (Dibayar)</th>
                  <th className="py-3.5 px-4 text-right">Sisa Piutang</th>
                  <th className="py-3.5 px-4 text-center">Status Pembayaran</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {filteredContracts.map((c) => {
                  const isPaid = c.paymentStatus === 'PAID' || c.remainingPiutang <= 0
                  const isPartial = c.paymentStatus === 'PARTIAL' || (c.paidAmount > 0 && c.remainingPiutang > 0)

                  return (
                    <tr key={c.id} className="hover:bg-[#F5F5F7] transition-colors">
                      {/* Contract Number & Date */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/contracts/${c.id}`}
                          className="font-bold text-[#007AFF] hover:underline block text-xs"
                        >
                          {c.contractNumber}
                        </Link>
                        <span className="text-[10px] text-[#6E6E73]">{formatDate(c.startDate)}</span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1D1D1F] block">{c.customer?.name}</span>
                        {c.customer?.phone && (
                          <span className="text-[10px] text-[#6E6E73]">{c.customer.phone}</span>
                        )}
                      </td>

                      {/* Truck & Driver */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-[#1D1D1F]">
                          <Truck className="w-3.5 h-3.5 text-[#8E8E93]" />
                          <span>{c.truck?.policeNumber}</span>
                        </div>
                        <span className="text-[10px] text-[#6E6E73] block mt-0.5">Supir: {c.driverName}</span>
                      </td>

                      {/* Contract Value */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1D1D1F]">
                        {formatCurrency(c.totalRevenue)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#34C759]">
                        +{formatCurrency(c.paidAmount)}
                      </td>

                      {/* Remaining Piutang */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={c.remainingPiutang > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}>
                          {formatCurrency(c.remainingPiutang)}
                        </span>
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isPaid ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20 inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> LUNAS
                          </span>
                        ) : isPartial ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> DIBAYAR SEBAGIAN
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> BELUM DIBAYAR
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#FF9500]/10 hover:bg-[#FF9500]/20 text-[#D67E00] border border-[#FF9500]/30 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                            title="Ubah Status & Nominal Pembayaran (Misal: Koreksi Salah Tandai Lunas)"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Ubah Status
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => openPaymentModal(c)}
                              className="px-3 py-1.5 rounded-xl bg-[#34C759] hover:bg-[#28A745] text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                            >
                              <PlusCircle className="w-3.5 h-3.5" /> Catat Uang Masuk
                            </button>
                          )}
                          <Link
                            href={`/contracts/${c.id}`}
                            className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#007AFF]" /> Detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedContract && (
        <RecordPaymentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedContract(null)
          }}
          contract={selectedContract}
        />
      )}

      {/* Edit Payment Status Modal */}
      {selectedEditContract && (
        <EditPaymentStatusModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedEditContract(null)
          }}
          contract={selectedEditContract}
        />
      )}
    </div>
  )
}
