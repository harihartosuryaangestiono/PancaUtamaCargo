'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  RefreshCw,
  Filter,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  FileText,
  Wrench,
  Search,
  Plus,
} from 'lucide-react'
import { CreateTransactionModal } from './CreateTransactionModal'
import { syncAllFinancialDataAction } from '@/app/actions/financialActions'

interface FinancialsClientViewProps {
  initialTransactions: any[]
  pnl: {
    totalIncome: number
    totalExpense: number
    netProfit: number
    incomeByCategory: Record<string, number>
    expenseByCategory: Record<string, number>
    transactionCount: number
  }
  incomeCategories: Array<{ id: string; name: string }>
  expenseCategories: Array<{ id: string; name: string }>
  customers: Array<{ id: string; name: string }>
  userRole: string
}

export function FinancialsClientView({
  initialTransactions,
  pnl,
  incomeCategories,
  expenseCategories,
  customers,
  userRole,
}: FinancialsClientViewProps) {
  const router = useRouter()
  const [sourceFilter, setSourceFilter] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')
  const [syncLoading, setSyncLoading] = useState<boolean>(false)
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null)

  const filteredTransactions = initialTransactions.filter((t) => {
    if (sourceFilter !== 'ALL' && t.source !== sourceFilter) return false

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const matchNum = t.transactionNumber?.toLowerCase().includes(q)
      const matchDesc = t.description?.toLowerCase().includes(q)
      const matchCat = t.categoryName?.toLowerCase().includes(q)
      const matchUser = t.createdByName?.toLowerCase().includes(q)
      if (!matchNum && !matchDesc && !matchCat && !matchUser) return false
    }

    return true
  })

  async function handleSyncAll() {
    try {
      setSyncLoading(true)
      setSyncSuccess(null)
      const res = await syncAllFinancialDataAction()
      if (res.success) {
        setSyncSuccess(`Berhasil mengonsolidasi & menyinkronkan ${res.syncedCount} transaksi dari seluruh modul!`)
        router.refresh()
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyinkronkan data keuangan.')
    } finally {
      setSyncLoading(false)
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'BUKU_KAS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#C67300] border border-[#FF9500]/20 inline-flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" /> Buku Kas
          </span>
        )
      case 'BANK_BCA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 inline-flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Bank BCA
          </span>
        )
      case 'MAINTENANCE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 inline-flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Maintenance
          </span>
        )
      case 'KONTRAK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20 inline-flex items-center gap-1">
            <FileText className="w-3 h-3" /> Kontrak
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Jurnal Keuangan
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Pembukuan Keuangan Terpadu &amp; P&amp;L
          </h2>
          <p className="text-xs text-[#6E6E73] font-medium mt-1">
            Jurnal terintegrasi pemasukan &amp; pengeluaran dari Jurnal Keuangan, Buku Kas, BCA, Kontrak, &amp; Maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sync All Button */}
          <button
            onClick={handleSyncAll}
            disabled={syncLoading}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F5F5F7] text-[#007AFF] font-bold text-xs border border-[#007AFF]/30 shadow-2xs transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            title="Sinkronkan seluruh transaksi dari Buku Kas, BCA, Kontrak, dan Perbaikan Armada"
          >
            <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin text-[#007AFF]' : ''}`} />
            <span>{syncLoading ? 'Menyinkronkan...' : 'Sinkronkan Semua Data Keuangan'}</span>
          </button>

          {/* New Transaction Modal Button */}
          <CreateTransactionModal
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            customers={customers}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {syncSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncSuccess}</span>
          </div>
          <button onClick={() => setSyncSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-bold text-sm">
            &times;
          </button>
        </div>
      )}

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total Pemasukan */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-1 hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between text-[#34C759]">
            <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Total Pemasukan Konsolidasi</span>
            <TrendingUp className="w-5 h-5 text-[#34C759]" />
          </div>
          <p className="text-2xl font-black text-[#34C759] tracking-tight mt-1">
            {formatCurrency(pnl.totalIncome)}
          </p>
          <p className="text-[11px] text-[#6E6E73] font-medium">
            Gabungan Jurnal, Uang Masuk Kontrak, &amp; Kas
          </p>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-1 hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between text-[#FF3B30]">
            <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Total Pengeluaran Konsolidasi</span>
            <TrendingDown className="w-5 h-5 text-[#FF3B30]" />
          </div>
          <p className="text-2xl font-black text-[#FF3B30] tracking-tight mt-1">
            {formatCurrency(pnl.totalExpense)}
          </p>
          <p className="text-[11px] text-[#6E6E73] font-medium">
            Gabungan Jurnal, Maintenance, BBM, &amp; Kas
          </p>
        </div>

        {/* Card 3: Net Profit */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-1 hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between text-[#1D1D1F]">
            <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Net Profit (Laba Bersih)</span>
            <Scale className="w-5 h-5 text-[#007AFF]" />
          </div>
          <p className={`text-2xl font-black tracking-tight mt-1 ${pnl.netProfit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
            {formatCurrency(pnl.netProfit)}
          </p>
          <p className="text-[11px] text-[#6E6E73] font-medium">
            {pnl.transactionCount} Total catatan transaksi keuangan
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. transaksi, deskripsi, kategori..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
          />
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl border border-black/[0.08] overflow-x-auto max-w-full">
          <button
            onClick={() => setSourceFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              sourceFilter === 'ALL' ? 'bg-white text-[#1D1D1F] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Semua Terpadu
          </button>
          <button
            onClick={() => setSourceFilter('JURNAL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              sourceFilter === 'JURNAL' ? 'bg-white text-[#007AFF] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Jurnal Keuangan
          </button>
          <button
            onClick={() => setSourceFilter('BUKU_KAS')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              sourceFilter === 'BUKU_KAS' ? 'bg-white text-[#C67300] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Buku Kas
          </button>
          <button
            onClick={() => setSourceFilter('BANK_BCA')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              sourceFilter === 'BANK_BCA' ? 'bg-white text-[#007AFF] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Bank BCA
          </button>
          <button
            onClick={() => setSourceFilter('MAINTENANCE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              sourceFilter === 'MAINTENANCE' ? 'bg-white text-rose-600 shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Maintenance
          </button>
          <button
            onClick={() => setSourceFilter('KONTRAK')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              sourceFilter === 'KONTRAK' ? 'bg-white text-[#248A3D] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Kontrak
          </button>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <DollarSign className="w-10 h-10 text-[#8E8E93] mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-[#1D1D1F]">Tidak Ada Transaksi Keuangan</h4>
            <p className="text-xs text-[#6E6E73]">
              Tidak ada catatan transaksi sesuai kriteria pencarian dan filter sumber data yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFAFA] text-[#6E6E73] uppercase tracking-wider font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">No. Transaksi / Tanggal</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Deskripsi</th>
                  <th className="py-3.5 px-4 text-right">Nominal Rp</th>
                  <th className="py-3.5 px-4">Sumber Data</th>
                  <th className="py-3.5 px-4">Metode Bayar</th>
                  <th className="py-3.5 px-4">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1D1D1F] block">
                        {t.transactionNumber}
                      </span>
                      <span className="text-[10px] text-[#6E6E73] font-mono">{formatDate(t.date)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {t.type === 'INCOME' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20">
                          + INCOME
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                          - EXPENSE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">
                      {t.categoryName}
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      {t.description}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-mono font-bold ${t.type === 'INCOME' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                    </td>
                    <td className="py-3.5 px-4">
                      {getSourceBadge(t.source)}
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      {t.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      {t.createdByName}
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
