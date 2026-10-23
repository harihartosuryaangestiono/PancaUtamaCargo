'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCustomerAction } from '@/app/actions/customerActions'
import { Pencil, X } from 'lucide-react'

interface EditCustomerModalProps {
  customer: {
    id: string
    code: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    notes: string | null
  }
}

export function EditCustomerModal({ customer }: EditCustomerModalProps) {
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
      const result = await updateCustomerAction(customer.id, {
        code: formData.get('code')?.toString() || '',
        name: formData.get('name')?.toString() || '',
        phone: formData.get('phone')?.toString() || '',
        email: formData.get('email')?.toString() || '',
        address: formData.get('address')?.toString() || '',
        notes: formData.get('notes')?.toString() || '',
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        className="px-3 py-1.5 text-xs font-semibold text-[#007AFF] hover:text-[#0062CC] bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl transition-colors inline-flex items-center gap-1.5"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-black/[0.08] shadow-2xl overflow-y-auto max-h-[90vh] text-[#1D1D1F]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div>
                <h3 className="text-base font-semibold">Edit Data Pelanggan</h3>
                <p className="text-xs text-[#6E6E73] mt-1">{customer.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                aria-label="Tutup"
                className="p-2 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div role="alert" className="p-3 rounded-xl bg-rose-50 text-[#FF3B30] text-xs font-semibold border border-rose-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-semibold">
                  Kode Pelanggan *
                  <input
                    type="text"
                    name="code"
                    required
                    defaultValue={customer.code}
                    className="mt-1 w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Nama Pelanggan / Perusahaan *
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={customer.name}
                    className="mt-1 w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-semibold">
                  Telepon
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={customer.phone || ''}
                    className="mt-1 w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Email
                  <input
                    type="email"
                    name="email"
                    defaultValue={customer.email || ''}
                    className="mt-1 w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold">
                Alamat Lengkap
                <textarea
                  name="address"
                  rows={2}
                  defaultValue={customer.address || ''}
                  className="mt-1 w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </label>

              <label className="block text-xs font-semibold">
                Catatan
                <input
                  type="text"
                  name="notes"
                  defaultValue={customer.notes || ''}
                  className="mt-1 w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-xl disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
