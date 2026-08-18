'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFinancialTransactionAction } from '@/app/actions/financialActions'
import { Plus, X, DollarSign } from 'lucide-react'

interface CreateTransactionModalProps {
  incomeCategories: Array<{ id: string; name: string }>
  expenseCategories: Array<{ id: string; name: string }>
  customers: Array<{ id: string; name: string }>
}

export function CreateTransactionModal({
  incomeCategories,
  expenseCategories,
  customers,
}: CreateTransactionModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const input = {
        type,
        date: formData.get('date')?.toString() || new Date().toISOString().split('T')[0],
        categoryId: formData.get('categoryId')?.toString() || '',
        description: formData.get('description')?.toString() || '',
        amount: Number(formData.get('amount') || 0),
        customerId: formData.get('customerId')?.toString() || undefined,
        purchaseSource: formData.get('purchaseSource')?.toString() || undefined,
        paymentMethod: formData.get('paymentMethod')?.toString() || 'TRANSFER',
        referenceNumber: formData.get('referenceNumber')?.toString() || undefined,
        notes: formData.get('notes')?.toString() || undefined,
      }

      const res = await createFinancialTransactionAction(input)
      if (res.error) {
        setError(res.error)
        setLoading(false)
      } else {
        setLoading(false)
        setOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mencatat transaksi.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Catat Transaksi Pembukuan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-black/[0.08] shadow-2xl overflow-y-auto max-h-[90vh] text-[#1D1D1F]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Input Transaksi Pembukuan
                  </h3>
                  <p className="text-xs text-[#6E6E73]">Pemasukan (Income) atau Pengeluaran (Expense)</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-[#FF3B30] text-xs font-semibold border border-rose-200">
                  {error}
                </div>
              )}

              {/* Toggle Type */}
              <div className="flex p-1 bg-[#F5F5F7] rounded-xl border border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setType('INCOME')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    type === 'INCOME'
                      ? 'bg-white text-[#248A3D] shadow-2xs border border-black/[0.06]'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  + Pemasukan (Income)
                </button>
                <button
                  type="button"
                  onClick={() => setType('EXPENSE')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    type === 'EXPENSE'
                      ? 'bg-white text-[#FF3B30] shadow-2xs border border-black/[0.06]'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  - Pengeluaran (Expense)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Tanggal Transaksi *
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Kategori *
                </label>
                <select
                  name="categoryId"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {type === 'INCOME'
                    ? incomeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    : expenseCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Deskripsi Transaksi *
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Keterangan transaksi"
                  className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Nominal Rp *
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  placeholder="e.g. 1500000"
                  className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium font-mono"
                />
              </div>

              {type === 'EXPENSE' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Sumber Pembelian / Pemasok (Opsional)
                  </label>
                  <input
                    type="text"
                    name="purchaseSource"
                    placeholder="e.g. Toko Onderdil Jaya / Bengkel Utama"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
