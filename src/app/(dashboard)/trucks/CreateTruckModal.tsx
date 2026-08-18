'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTruckAction } from '@/app/actions/truckActions'
import { Plus, X, Truck } from 'lucide-react'

export function CreateTruckModal() {
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
        truckCode: formData.get('truckCode')?.toString() || '',
        policeNumber: formData.get('policeNumber')?.toString() || '',
        brand: formData.get('brand')?.toString() || 'Mitsubishi',
        model: formData.get('model')?.toString() || 'Fighter',
        variant: formData.get('variant')?.toString() || 'F61L HD R',
        vehicleType: formData.get('vehicleType')?.toString() || 'Tronton',
        driveConfiguration: formData.get('driveConfiguration')?.toString() || '6x2',
        transmission: formData.get('transmission')?.toString() || 'Manual Transmission (M/T)',
        fuelTankConfiguration: formData.get('fuelTankConfiguration')?.toString() || 'Double Tank',
        chassisNumber: formData.get('chassisNumber')?.toString() || undefined,
        engineNumber: formData.get('engineNumber')?.toString() || undefined,
        year: formData.get('year') ? Number(formData.get('year')) : undefined,
        color: formData.get('color')?.toString() || undefined,
        capacity: formData.get('capacity')?.toString() || undefined,
        purchaseDate: formData.get('purchaseDate')?.toString() || undefined,
        purchasePrice: formData.get('purchasePrice') ? Number(formData.get('purchasePrice')) : undefined,
        notes: formData.get('notes')?.toString() || undefined,
      }

      const res = await createTruckAction(input)
      if (res.error) {
        setError(res.error)
        setLoading(false)
      } else {
        setLoading(false)
        setOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data truck.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Register Truck Baru
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-black/[0.08] shadow-2xl overflow-y-auto max-h-[90vh] text-[#1D1D1F]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Register Truck Baru
                  </h3>
                  <p className="text-xs text-[#6E6E73]">Preset Utama: Mitsubishi Fighter F61L HD R 6×2</p>
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
                    Truck Code *
                  </label>
                  <input
                    type="text"
                    name="truckCode"
                    required
                    placeholder="e.g. TRK-01"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Nomor Polisi *
                  </label>
                  <input
                    type="text"
                    name="policeNumber"
                    required
                    placeholder="e.g. B 9876 XYZ"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Merk (Brand)
                  </label>
                  <input
                    type="text"
                    name="brand"
                    defaultValue="Mitsubishi"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    defaultValue="Fighter"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Variant
                  </label>
                  <input
                    type="text"
                    name="variant"
                    defaultValue="F61L HD R"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Konfigurasi Penggerak
                  </label>
                  <input
                    type="text"
                    name="driveConfiguration"
                    defaultValue="6x2"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Transmisi
                  </label>
                  <input
                    type="text"
                    name="transmission"
                    defaultValue="Manual Transmission (M/T)"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Konfigurasi Tangki BBM
                  </label>
                  <input
                    type="text"
                    name="fuelTankConfiguration"
                    defaultValue="Double Tank"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Nomor Rangka (Chassis Number)
                  </label>
                  <input
                    type="text"
                    name="chassisNumber"
                    placeholder="Diinput manual oleh Owner"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Nomor Mesin (Engine Number)
                  </label>
                  <input
                    type="text"
                    name="engineNumber"
                    placeholder="Diinput manual oleh Owner"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Tahun Pembelian
                  </label>
                  <input
                    type="number"
                    name="year"
                    placeholder="e.g. 2024"
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
                    placeholder="Kosongkan jika belum ada data"
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
                  {loading ? 'Menyimpan...' : 'Simpan & Generate 10 Wheel Positions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
