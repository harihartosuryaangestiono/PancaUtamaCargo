'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateContractPaymentStatusAction } from '@/app/actions/contractActions'
import { formatCurrency } from '@/lib/utils/format'
import { X, Edit3, DollarSign, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react'

interface EditPaymentStatusModalProps {
  isOpen: boolean
  onClose: () => void
  contract: {
    id: string
    contractNumber: string
    customer?: { name: string }
    totalRevenue: number
    paidAmount: number
    paymentStatus: string
    remainingPiutang: number
  }
  onSuccess?: () => void
}

export function EditPaymentStatusModal({ isOpen, onClose, contract, onSuccess }: EditPaymentStatusModalProps) {
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'PARTIAL' | 'PAID'>(
    (contract.paymentStatus as any) || (contract.paidAmount >= contract.totalRevenue ? 'PAID' : contract.paidAmount > 0 ? 'PARTIAL' : 'UNPAID')
  )
  const [paidAmount, setPaidAmount] = useState<string>(String(contract.paidAmount || 0))
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const numPaid = Number(paidAmount) || 0
  const computedRemaining = Math.max(0, contract.totalRevenue - numPaid)

  function handleSelectStatus(status: 'UNPAID' | 'PARTIAL' | 'PAID') {
    setPaymentStatus(status)
    if (status === 'UNPAID') {
      setPaidAmount('0')
    } else if (status === 'PAID') {
      setPaidAmount(String(contract.totalRevenue))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const res = await updateContractPaymentStatusAction({
        contractId: contract.id,
        paymentStatus,
        paidAmount: numPaid,
        notes: notes || undefined,
      })

      if (res.error) {
        setError(res.error)
        return
      }

      onClose()
      if (onSuccess) onSuccess()
      router.refresh()
      window.location.reload()
    } catch (err: any) {

      setError(err.message || 'Gagal memperbarui status pembayaran.')
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
            <span className="text-[10px] font-bold text-[#FF9500] uppercase tracking-wider block">Koreksi Data Piutang</span>
            <h3 className="text-base font-bold text-[#1D1D1F]">Ubah Status &amp; Nominal Pembayaran</h3>
            <p className="text-xs text-[#6E6E73] mt-0.5 font-medium">
              Kontrak <span className="font-semibold text-[#1D1D1F]">{contract.contractNumber}</span> — {contract.customer?.name}
            </p>
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

          {/* Contract Information Summary */}
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2">
            <div className="flex justify-between text-[#6E6E73]">
              <span>Total Nilai Kontrak (ERP 1 + 2):</span>
              <span className="font-bold text-[#1D1D1F] font-mono">{formatCurrency(contract.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-[#6E6E73]">
              <span>Nominal Uang Masuk Saat Ini:</span>
              <span className="font-bold text-[#34C759] font-mono">+{formatCurrency(contract.paidAmount)}</span>
            </div>
          </div>

          {/* Payment Status Option Tabs */}
          <div className="space-y-2">
            <label className="font-semibold text-[#1D1D1F] block">
              Pilih Status Pembayaran Baru <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: UNPAID */}
              <button
                type="button"
                onClick={() => handleSelectStatus('UNPAID')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                  paymentStatus === 'UNPAID'
                    ? 'bg-[#FF3B30]/10 border-[#FF3B30] text-[#FF3B30] font-bold shadow-2xs'
                    : 'bg-[#F5F5F7] border-black/[0.08] text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-[11px]">Belum Dibayar</span>
              </button>

              {/* Option 2: PARTIAL */}
              <button
                type="button"
                onClick={() => handleSelectStatus('PARTIAL')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                  paymentStatus === 'PARTIAL'
                    ? 'bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF] font-bold shadow-2xs'
                    : 'bg-[#F5F5F7] border-black/[0.08] text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <Clock className="w-4 h-4 text-[#007AFF]" />
                <span className="text-[11px]">Dibayar Sebagian</span>
              </button>

              {/* Option 3: PAID */}
              <button
                type="button"
                onClick={() => handleSelectStatus('PAID')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                  paymentStatus === 'PAID'
                    ? 'bg-[#34C759]/10 border-[#34C759] text-[#248A3D] font-bold shadow-2xs'
                    : 'bg-[#F5F5F7] border-black/[0.08] text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                <span className="text-[11px]">Lunas</span>
              </button>
            </div>
          </div>

          {/* Paid Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#34C759]" />
                Total Nominal Uang Masuk Diterima (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('UNPAID')
                    setPaidAmount('0')
                  }}
                  className="text-[10px] font-bold text-[#FF3B30] hover:underline"
                >
                  Reset Rp 0
                </button>
                <span className="text-[#8E8E93]">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('PAID')
                    setPaidAmount(String(contract.totalRevenue))
                  }}
                  className="text-[10px] font-bold text-[#34C759] hover:underline"
                >
                  Full ({formatCurrency(contract.totalRevenue)})
                </button>
              </div>
            </div>
            <input
              type="number"
              required
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="Masukkan nominal yang sudah diterima"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-bold text-sm text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
            />
          </div>

          {/* Recalculated Remaining Piutang Info */}
          <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-between">
            <span className="text-[#6E6E73] font-medium">Sisa Piutang Setelah Koreksi:</span>
            <span className={`font-mono font-extrabold text-sm ${computedRemaining > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
              {formatCurrency(computedRemaining)}
            </span>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#8E8E93]" />
              Catatan Alasan Perubahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Koreksi salah tandai lunas / Penyesuaian sisa tagihan"
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
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
              className="px-5 py-2.5 rounded-xl font-semibold bg-[#FF9500] text-white hover:bg-[#E08200] transition-colors shadow-2xs inline-flex items-center gap-2"
            >
              {loading ? (
                'Memproses...'
              ) : (
                <>
                  <Edit3 className="w-4 h-4" /> Simpan Perubahan Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
