'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDriverAction } from '@/app/actions/driverActions'
import { User, Phone, MapPin, CreditCard, Calendar, X, AlertCircle } from 'lucide-react'

interface CreateDriverModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateDriverModal({ isOpen, onClose }: CreateDriverModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseType, setLicenseType] = useState('SIM B2 Umum')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await createDriverAction({
        name,
        phone,
        address,
        licenseNumber,
        licenseType,
        licenseExpiry,
        notes,
      })

      if (res.error) {
        setError(res.error)
        setLoading(false)
      } else {
        setLoading(false)
        onClose()
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menambahkan pengemudi.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs text-[#1D1D1F]">
      <div className="bg-white border border-black/[0.08] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">Tambah Pengemudi Baru</h3>
              <p className="text-xs text-[#6E6E73]">Pendaftaran master data pengemudi armada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-[#FF3B30] font-semibold border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#1D1D1F] mb-1.5">
              Nama Lengkap Pengemudi <span className="text-[#FF3B30]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pak Budi Santoso"
              className="w-full px-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#1D1D1F] mb-1.5">
                Nomor Telepon / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[#8E8E93]" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1D1D1F] mb-1.5">
                Jenis SIM
              </label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 font-medium"
              >
                <option value="SIM B2 Umum">SIM B2 Umum</option>
                <option value="SIM B1 Umum">SIM B1 Umum</option>
                <option value="SIM B2">SIM B2</option>
                <option value="SIM B1">SIM B1</option>
                <option value="SIM A">SIM A</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#1D1D1F] mb-1.5">
                Nomor SIM
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-[#8E8E93]" />
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="3301xxxxxxxxxxxx"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 font-medium font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1D1D1F] mb-1.5">
                Masa Berlaku SIM
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-[#8E8E93]" />
                <input
                  type="date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1D1D1F] mb-1.5">
              Alamat Lengkap
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-[#8E8E93]" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Raya Magelang No. 12, Magelang"
                className="w-full pl-9 pr-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1D1D1F] mb-1.5">
              Catatan Khusus
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan mengenai pengemudi..."
              className="w-full px-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-colors disabled:opacity-50 shadow-2xs"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pengemudi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
