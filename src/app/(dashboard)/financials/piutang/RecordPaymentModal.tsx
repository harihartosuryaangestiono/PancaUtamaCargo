'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordContractPaymentAction } from '@/app/actions/contractActions'
import { formatCurrency } from '@/lib/utils/format'
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, Hash, FileText } from 'lucide-react'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  contract: {
    id: string
    contractNumber: string
    customer?: { name: string }
    totalRevenue: number
    paidAmount: number
    remainingPiutang: number
  }
  onSuccess?: () => void
}

export function RecordPaymentModal({ isOpen, onClose, contract, onSuccess }: RecordPaymentModalProps) {
  const router = useRouter()
  const [amount, setAmount] = useState<string>(String(contract.remainingPiutang > 0 ? contract.remainingPiutang : ''))
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<string>('TRANSFER')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const remaining = Math.max(0, contract.totalRevenue - contract.paidAmount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      setError('Masukkan nominal pembayaran yang valid (lebih besar dari 0).')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await recordContractPaymentAction({
        contractId: contract.id,
        amount: numAmount,
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      })

      if (res.error) {
        setError(res.error)
        return
      }

      onClose()
      if (onSuccess) onSuccess()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal mencatat pembayaran.')
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
            <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wider block">Pembukuan Piutang Customer</span>
            <h3 className="text-base font-bold text-[#1D1D1F]">Catat Uang Masuk / Pelunasan</h3>
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

          {/* Contract Breakdown Card */}
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2">
            <div className="flex justify-between text-[#6E6E73]">
              <span>Total Nilai Kontrak (ERP 1 + 2):</span>
              <span className="font-semibold text-[#1D1D1F]">{formatCurrency(contract.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-[#34C759]">
              <span>Total Uang Masuk (Sudah Dibayar):</span>
              <span className="font-semibold">+{formatCurrency(contract.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-[#1D1D1F] font-bold border-t border-black/[0.08] pt-2 text-xs">
              <span>Sisa Piutang (Belum Lunas):</span>
              <span className={remaining > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}>
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          {/* Amount Input with Quick Action */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#007AFF]" />
                Nominal Transfer / Uang Masuk (Rp) <span className="text-rose-500">*</span>
              </label>
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(remaining))}
                  className="text-[11px] font-bold text-[#007AFF] hover:underline"
                >
                  Set Pelunasan Penuh ({formatCurrency(remaining)})
                </button>
              )}
            </div>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Masukkan nominal transfer (Contoh: 15000000)"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-bold text-sm text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Date */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#8E8E93]" />
                Tanggal Transfer <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#8E8E93]" />
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
              >
                <option value="TRANSFER">Transfer Bank (BCA / Mandiri / DLL)</option>
                <option value="CASH">Tunai / Cash</option>
                <option value="GIRO">Giro / Cek</option>
                <option value="CREDIT">Kredit / Piutang Usaha</option>
              </select>
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-[#8E8E93]" />
              No. Referensi / No. Bukti Transfer (Opsional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Contoh: BCA-98471239 / No. Resi Bank"
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#8E8E93]" />
              Catatan Keterangan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pelunasan sisa tagihan angkutan kayu lapis"
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 resize-none"
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
              className="px-5 py-2.5 rounded-xl font-semibold bg-[#34C759] text-white hover:bg-[#28A745] transition-colors shadow-2xs inline-flex items-center gap-2"
            >
              {loading ? (
                'Memproses...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Simpan Uang Masuk
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
