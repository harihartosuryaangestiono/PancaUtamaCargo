'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTireAction } from '@/app/actions/tireActions'
import { Plus, X, Disc } from 'lucide-react'

interface CreateTireModalProps {
  defaultTireLifetimeKm: number
}

export function CreateTireModal({ defaultTireLifetimeKm }: CreateTireModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const input = {
        tireCode: formData.get('tireCode')?.toString() || '',
        brand: formData.get('brand')?.toString() || '',
        model: formData.get('model')?.toString() || 'Standard',
        size: formData.get('size')?.toString() || '11.00-20',
        serialNumber: formData.get('serialNumber')?.toString() || '',
        purchaseDate: formData.get('purchaseDate')?.toString() || new Date().toISOString().split('T')[0],
        purchasePrice: formData.get('purchasePrice') ? Number(formData.get('purchasePrice')) : undefined,
        expectedLifetimeKm: formData.get('expectedLifetimeKm') ? Number(formData.get('expectedLifetimeKm')) : defaultTireLifetimeKm,
        notes: formData.get('notes')?.toString() || undefined,
      }

      const res = await createTireAction(input)
      if (res.error) {
        setError(res.error)
        setLoading(false)
      } else {
        setLoading(false)
        setOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data ban.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Register Ban Baru
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-black/[0.08] shadow-2xl overflow-y-auto max-h-[90vh] text-[#1D1D1F]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <Disc className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Register Ban Baru
                  </h3>
                  <p className="text-xs text-[#6E6E73]">
                    Default Expected Lifetime: {defaultTireLifetimeKm.toLocaleString('id-ID')} KM
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-[#FF3B30] font-semibold border border-rose-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Kode Ban (ID) *
                  </label>
                  <input
                    type="text"
                    name="tireCode"
                    required
                    placeholder="e.g. BAN-01"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Nomor Seri (Serial Number) *
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    required
                    placeholder="Unik per ban"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Merk (Brand) *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    required
                    placeholder="e.g. Bridgestone / Giti"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Model &amp; Ukuran
                  </label>
                  <input
                    type="text"
                    name="size"
                    defaultValue="11.00-20"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Expected Lifetime (KM)
                  </label>
                  <input
                    type="number"
                    name="expectedLifetimeKm"
                    defaultValue={defaultTireLifetimeKm}
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Harga Pembelian (Rp)
                  </label>
                  <input
                    type="number"
                    name="purchasePrice"
                    defaultValue={0}
                    placeholder="0 (Bawaan Beli Truck)"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium font-mono"
                  />
                </div>
              </div>

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
                  {loading ? 'Menyimpan...' : 'Simpan Ban Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
