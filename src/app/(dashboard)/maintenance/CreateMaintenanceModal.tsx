'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMaintenanceAction } from '@/app/actions/maintenanceActions'
import { Plus, X, Wrench } from 'lucide-react'

interface CreateMaintenanceModalProps {
  trucks: Array<{ id: string; truckCode: string; policeNumber: string; totalKm: number }>
}

export function CreateMaintenanceModal({ trucks }: CreateMaintenanceModalProps) {
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
      const truckId = formData.get('truckId')?.toString() || ''
      const date = formData.get('date')?.toString() || new Date().toISOString().split('T')[0]
      const kmAtMaintenance = Number(formData.get('kmAtMaintenance') || 0)
      const maintenanceType = formData.get('maintenanceType')?.toString() as any
      const description = formData.get('description')?.toString() || ''
      const laborCost = formData.get('laborCost') ? Number(formData.get('laborCost')) : undefined
      const sparepartCost = formData.get('sparepartCost') ? Number(formData.get('sparepartCost')) : undefined
      const otherCost = formData.get('otherCost') ? Number(formData.get('otherCost')) : undefined
      const workshop = formData.get('workshop')?.toString() || undefined
      const notes = formData.get('notes')?.toString() || undefined

      const res = await createMaintenanceAction({
        date,
        truckId,
        kmAtMaintenance,
        maintenanceType,
        description,
        laborCost,
        sparepartCost,
        otherCost,
        workshop,
        notes,
      })

      if (res.error) {
        setError(res.error)
        setLoading(false)
      } else {
        setLoading(false)
        setOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mencatat maintenance.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Catat Service / Maintenance Baru
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-black/[0.08] shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Catat Maintenance &amp; Service Truck
                  </h3>
                  <p className="text-xs text-[#6E6E73]">Catat perbaikan rutin, ganti oli, sparepart, dan biaya bengkel</p>
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
                <div className="p-3 rounded-xl bg-rose-50 text-[#FF3B30] text-xs font-semibold border border-rose-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Truck *
                  </label>
                  <select
                    name="truckId"
                    required
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  >
                    <option value="">-- Pilih Truck --</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.truckCode} ({t.policeNumber}) - Odometer: {t.totalKm} KM
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Tanggal Servis *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Odometer KM saat Servis *
                  </label>
                  <input
                    type="number"
                    name="kmAtMaintenance"
                    required
                    placeholder="e.g. 120000"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Tipe Maintenance *
                  </label>
                  <select
                    name="maintenanceType"
                    required
                    defaultValue="ROUTINE_SERVICE"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  >
                    <option value="ROUTINE_SERVICE">ROUTINE_SERVICE (Servis Rutin)</option>
                    <option value="REPAIR">REPAIR (Perbaikan Kerusakan)</option>
                    <option value="OIL_CHANGE">OIL_CHANGE (Ganti Oli Mesin)</option>
                    <option value="BRAKE">BRAKE (Sistem Rem)</option>
                    <option value="SUSPENSION">SUSPENSION (Kaki-kaki / Suspensi)</option>
                    <option value="ENGINE">ENGINE (Mesin / Overhaul)</option>
                    <option value="ELECTRICAL">ELECTRICAL (Kelistrikan)</option>
                    <option value="TIRE">TIRE (Ban / Sporing Balancing)</option>
                    <option value="OTHER">OTHER (Lainnya)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Deskripsi Pekerjaan / Perbaikan *
                  </label>
                  <input
                    type="text"
                    name="description"
                    required
                    placeholder="e.g. Ganti Oli Mesin Shell Rimula 15W-40 & Filter Oli"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Biaya Jasa / Labor (Rp)
                  </label>
                  <input
                    type="number"
                    name="laborCost"
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Biaya Sparepart (Rp)
                  </label>
                  <input
                    type="number"
                    name="sparepartCost"
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Biaya Lain-lain (Rp)
                  </label>
                  <input
                    type="number"
                    name="otherCost"
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Nama Bengkel / Workshop
                  </label>
                  <input
                    type="text"
                    name="workshop"
                    placeholder="e.g. Bengkel Resmi Mitsubishi / Bengkel Utama"
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
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
                  {loading ? 'Menyimpan...' : 'Simpan Log Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
