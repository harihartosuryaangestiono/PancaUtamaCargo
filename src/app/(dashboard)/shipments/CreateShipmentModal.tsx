'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createShipmentAction } from '@/app/actions/shipmentActions'
import { Plus, X, Package } from 'lucide-react'

interface CreateShipmentModalProps {
  customers: Array<{ id: string; name: string }>
  trucks: Array<{ id: string; truckCode: string; policeNumber: string; totalKm: number }>
}

export function CreateShipmentModal({ customers, trucks }: CreateShipmentModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTruckKm, setSelectedTruckKm] = useState<number>(0)

  function handleTruckChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tId = e.target.value
    const t = trucks.find((trk) => trk.id === tId)
    if (t) setSelectedTruckKm(t.totalKm)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const input = {
        date: formData.get('date')?.toString() || new Date().toISOString().split('T')[0],
        customerId: formData.get('customerId')?.toString() || '',
        origin: formData.get('origin')?.toString() || '',
        destination: formData.get('destination')?.toString() || '',
        driverName: formData.get('driverName')?.toString() || 'Driver Utama',
        truckId: formData.get('truckId')?.toString() || '',
        startKm: Number(formData.get('startKm') || 0),
        endKm: Number(formData.get('endKm') || 0),
        revenue: formData.get('revenue') ? Number(formData.get('revenue')) : undefined,
        fuelCost: formData.get('fuelCost') ? Number(formData.get('fuelCost')) : undefined,
        tollCost: formData.get('tollCost') ? Number(formData.get('tollCost')) : undefined,
        otherCost: formData.get('otherCost') ? Number(formData.get('otherCost')) : undefined,
        notes: formData.get('notes')?.toString() || undefined,
      }

      const res = await createShipmentAction(input)
      if (res.error) {
        setError(res.error)
        setLoading(false)
      } else {
        setLoading(false)
        setOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mencatat pengiriman.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Catat Pengiriman Baru
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-black/[0.08] shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Input Data Surat Jalan / Pengiriman
                  </h3>
                  <p className="text-xs text-[#6E6E73]">Otomatis update KM truck, KM ban aktif &amp; pembukuan</p>
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
                <div className="p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-semibold border border-[#FF3B30]/20">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Tanggal Pengiriman *
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
                    Truck Tronton *
                  </label>
                  <select
                    name="truckId"
                    required
                    onChange={handleTruckChange}
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  >
                    <option value="">-- Pilih Truck --</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.truckCode} ({t.policeNumber}) - Odo: {t.totalKm} KM
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Customer *
                  </label>
                  <select
                    name="customerId"
                    required
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  >
                    <option value="">-- Pilih Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Nama Driver
                  </label>
                  <input
                    type="text"
                    name="driverName"
                    defaultValue="Driver Utama"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Kota Asal (Origin) *
                  </label>
                  <input
                    type="text"
                    name="origin"
                    required
                    placeholder="e.g. Jakarta"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Kota Tujuan (Destination) *
                  </label>
                  <input
                    type="text"
                    name="destination"
                    required
                    placeholder="e.g. Surabaya"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Odometer Awal (Start KM) *
                  </label>
                  <input
                    type="number"
                    name="startKm"
                    defaultValue={selectedTruckKm}
                    required
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Odometer Akhir (End KM) *
                  </label>
                  <input
                    type="number"
                    name="endKm"
                    required
                    placeholder="Harus > Start KM"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Revenue / Tagihan Pengiriman (Rp)
                  </label>
                  <input
                    type="number"
                    name="revenue"
                    placeholder="Kosongkan jika belum ada data tagihan"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6E6E73] hover:bg-[#F5F5F7] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan & Syncing KM...' : 'Simpan Surat Jalan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
