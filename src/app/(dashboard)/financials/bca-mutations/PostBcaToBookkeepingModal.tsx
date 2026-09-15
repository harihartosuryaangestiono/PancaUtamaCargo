'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { postBcaMutationToBookkeepingAction } from '@/app/actions/bcaMutationActions'
import { formatCurrency } from '@/lib/utils/format'
import { X, CheckCircle2, TrendingUp, TrendingDown, Building2, Truck, User, FileText, Wrench } from 'lucide-react'

interface PostBcaToBookkeepingModalProps {
  isOpen: boolean
  onClose: () => void
  mutation: {
    id: string
    dateRaw: string
    description: string
    amount: number
    type: 'CR' | 'DB' | string
    branch: string
  } | null
  incomeCategories: Array<{ id: string; name: string }>
  expenseCategories: Array<{ id: string; name: string }>
  customers: Array<{ id: string; name: string }>
  contracts: Array<{ id: string; contractNumber: string; customerId: string; remainingPiutang: number; customer?: { name: string } }>
  trucks: Array<{ id: string; policeNumber: string; brand: string; model: string }>
}

export function PostBcaToBookkeepingModal({
  isOpen,
  onClose,
  mutation,
  incomeCategories,
  expenseCategories,
  customers,
  contracts,
  trucks,
}: PostBcaToBookkeepingModalProps) {
  const router = useRouter()
  const isIncome = mutation?.type === 'CR'

  const [categoryId, setCategoryId] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [customerId, setCustomerId] = useState<string>('')
  const [contractId, setContractId] = useState<string>('')
  const [truckId, setTruckId] = useState<string>('')
  const [maintenanceType, setMaintenanceType] = useState<string>('REPAIR')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mutation) {
      setDescription(mutation.description)
      setError(null)
      // Set default category
      if (mutation.type === 'CR') {
        const found = incomeCategories.find(c => c.name.toLowerCase().includes('ongkos angkut') || c.name.toLowerCase().includes('sewa'))
        setCategoryId(found ? found.id : (incomeCategories[0]?.id || ''))
      } else {
        const found = expenseCategories.find(c => c.name.toLowerCase().includes('perbaikan') || c.name.toLowerCase().includes('maintenance') || c.name.toLowerCase().includes('service'))
        setCategoryId(found ? found.id : (expenseCategories[0]?.id || ''))
      }
    }
  }, [mutation, incomeCategories, expenseCategories])

  if (!isOpen || !mutation) return null

  // Filter contracts for selected customer
  const filteredContracts = customerId
    ? contracts.filter(c => c.customerId === customerId)
    : contracts

  const selectedContractObj = contracts.find(c => c.id === contractId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId) {
      setError('Silakan pilih Kategori Pembukuan.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await postBcaMutationToBookkeepingAction({
        bcaMutationId: mutation!.id,
        categoryId,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        description,
        customerId: customerId || undefined,
        contractId: contractId || undefined,
        truckId: truckId || undefined,
        maintenanceType: maintenanceType || undefined,
        notes: notes || undefined,
      })

      if (res.error) {
        setError(res.error)
        return
      }

      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal memposting mutasi BCA ke pembukuan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-black/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between bg-[#FAFAFA]">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#007AFF]" />
              <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wider">Posting Mutasi Rekening BCA</span>
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F]">Posting ke Pembukuan Keuangan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-[#FF3B30] font-semibold text-xs">
              {error}
            </div>
          )}

          {/* Bank Mutation Row Preview Card */}
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6E6E73] font-mono">TANGGAL: {mutation.dateRaw}</span>
              {isIncome ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20 inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> PEMASUKAN (CR)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 inline-flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> PENGELUARAN (DB)
                </span>
              )}
            </div>

            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] text-[#6E6E73] block">Keterangan BCA:</span>
                <p className="font-semibold text-[#1D1D1F] text-xs leading-snug line-clamp-2">{mutation.description}</p>
              </div>
              <span className={`text-base font-black font-mono shrink-0 ml-3 ${isIncome ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                {isIncome ? '+' : '-'}{formatCurrency(mutation.amount)}
              </span>
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#007AFF]" />
              Kategori {isIncome ? 'Pemasukan' : 'Pengeluaran'} <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-semibold text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 cursor-pointer"
            >
              {isIncome
                ? incomeCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                : expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
            </select>
          </div>

          {/* Conditional Inputs based on Income vs Expense */}
          {isIncome ? (
            /* INCOME: Option to link Customer and Contract */
            <div className="space-y-3 p-4 rounded-2xl bg-[#F0F7FF] border border-[#007AFF]/20">
              <div className="flex items-center justify-between text-[#007AFF]">
                <label className="font-bold text-xs flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Hubungkan ke Pelanggan &amp; Kontrak (Piutang)
                </label>
                <span className="text-[10px]">Opsional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Customer */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">Pelanggan</label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value)
                      setContractId('')
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#007AFF]/30 text-xs font-semibold text-[#1D1D1F]"
                  >
                    <option value="">-- Pilih Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contract */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">Kontrak Angkutan</label>
                  <select
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#007AFF]/30 text-xs font-semibold text-[#1D1D1F]"
                  >
                    <option value="">-- Pilih Kontrak --</option>
                    {filteredContracts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.contractNumber} ({formatCurrency(c.remainingPiutang)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedContractObj && (
                <div className="p-2.5 rounded-xl bg-white text-[11px] font-medium text-[#1D1D1F] border border-[#007AFF]/20 flex justify-between">
                  <span>Sisa Piutang Kontrak:</span>
                  <span className="font-bold text-[#FF3B30]">{formatCurrency(selectedContractObj.remainingPiutang)}</span>
                </div>
              )}
            </div>
          ) : (
            /* EXPENSE: Option to link Truck and Maintenance */
            <div className="space-y-3 p-4 rounded-2xl bg-[#FFF5F5] border border-[#FF3B30]/20">
              <div className="flex items-center justify-between text-[#FF3B30]">
                <label className="font-bold text-xs flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Alokasi Armada Truk &amp; Perbaikan
                </label>
                <span className="text-[10px]">Opsional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Truck */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">Armada Truk</label>
                  <select
                    value={truckId}
                    onChange={(e) => setTruckId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#FF3B30]/30 text-xs font-semibold text-[#1D1D1F]"
                  >
                    <option value="">-- Pilih Truk --</option>
                    {trucks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.policeNumber} ({t.brand} {t.model})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Maintenance Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">Jenis Service / Perbaikan</label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#FF3B30]/30 text-xs font-semibold text-[#1D1D1F]"
                  >
                    <option value="REPAIR">Perbaikan / Sparepart</option>
                    <option value="ROUTINE_SERVICE">Service Rutin</option>
                    <option value="OIL_CHANGE">Ganti Oli</option>
                    <option value="TIRE">Perbaikan Ban</option>
                    <option value="ENGINE">Mesin / Engine</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Custom Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1D1D1F]">Deskripsi Jurnal Pembukuan</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-xs text-[#1D1D1F]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1D1D1F]">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pembelian sparepart di Toko Terang Jaya"
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-xs text-[#1D1D1F]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-semibold bg-[#007AFF] text-white hover:bg-[#0062CC] transition-colors shadow-2xs inline-flex items-center gap-2"
            >
              {loading ? (
                'Memposting...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Posting ke Pembukuan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
