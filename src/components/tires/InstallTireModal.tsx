'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { installTireAction } from '@/app/actions/tireActions'
import { Disc, Truck as TruckIcon, Plus, X, Check } from 'lucide-react'

interface InstallTireModalProps {
  tireId: string
  tireCode: string
  serialNumber: string
  trucks: Array<{
    id: string
    truckCode: string
    policeNumber: string
    brand: string
    model: string
    totalKm: number
    wheelPositions: Array<{
      id: string
      positionCode: string
      positionName: string
      currentTireId: string | null
    }>
  }>
}

export function InstallTireModal({ tireId, tireCode, serialNumber, trucks }: InstallTireModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedTruckId, setSelectedTruckId] = useState<string>('')
  const [selectedPosId, setSelectedPosId] = useState<string>('')
  const [installedKm, setInstalledKm] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedTruck = trucks.find((t) => t.id === selectedTruckId)
  const selectedPos = selectedTruck?.wheelPositions.find((p) => p.id === selectedPosId)

  function handleSelectTruck(truckId: string) {
    setSelectedTruckId(truckId)
    const trk = trucks.find((t) => t.id === truckId)
    if (trk) {
      setInstalledKm(trk.totalKm)
    }
    setStep(2)
  }

  async function handleConfirm() {
    if (!selectedTruckId || !selectedPosId) return
    setLoading(true)
    setError(null)

    try {
      const res: any = await installTireAction({
        tireId,
        truckId: selectedTruckId,
        wheelPositionId: selectedPosId,
        installedKm,
      })
      if (res?.success) {
        setOpen(false)
        setStep(1)
        setSelectedTruckId('')
        setSelectedPosId('')
        router.refresh()
      } else if (res?.error) {
        setError(res.error)
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memasang ban ke truck.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Install to Truck
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-black/[0.08] shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <Disc className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Pemasangan Ban (Install to Truck)
                  </h3>
                  <p className="text-xs text-[#6E6E73] font-mono">
                    {tireCode} (SN: {serialNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOpen(false)
                  setStep(1)
                }}
                className="p-2 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-[#FF3B30] text-xs font-semibold border border-rose-200">
                {error}
              </div>
            )}

            {/* STEP 1: Select Truck */}
            {step === 1 && (
              <div className="space-y-4 text-xs">
                <h4 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
                  Langkah 1: Pilih Truck Tronton
                </h4>
                {trucks.length === 0 ? (
                  <p className="text-xs text-[#8E8E93] italic py-4">
                    Belum ada truck terdaftar. Silakan daftarkan truck terlebih dahulu.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {trucks.map((truck) => (
                      <button
                        key={truck.id}
                        onClick={() => handleSelectTruck(truck.id)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-black/[0.06] hover:border-[#007AFF] hover:bg-[#007AFF]/5 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] border border-black/[0.06] text-[#1D1D1F] flex items-center justify-center font-bold text-xs">
                            <TruckIcon className="w-4 h-4 text-[#007AFF]" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#1D1D1F] group-hover:text-[#007AFF]">
                              {truck.policeNumber} ({truck.truckCode})
                            </p>
                            <p className="text-[11px] text-[#6E6E73] font-mono">
                              {truck.brand} {truck.model} · Odometer: {truck.totalKm.toLocaleString()} KM
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#007AFF] group-hover:translate-x-1 transition-transform">
                          Pilih &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Select Wheel Position */}
            {step === 2 && selectedTruck && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
                    Langkah 2: Pilih Posisi Roda Chassis ({selectedTruck.policeNumber})
                  </h4>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-[#007AFF] hover:underline"
                  >
                    &larr; Ganti Truck
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                  {selectedTruck.wheelPositions.map((pos) => {
                    const isOccupied = !!pos.currentTireId
                    const isSelected = selectedPosId === pos.id

                    return (
                      <button
                        key={pos.id}
                        disabled={isOccupied}
                        onClick={() => {
                          setSelectedPosId(pos.id)
                          setStep(3)
                        }}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center min-h-[70px] ${
                          isOccupied
                            ? 'bg-[#F5F5F7] border-black/[0.06] opacity-50 cursor-not-allowed text-[#8E8E93]'
                            : isSelected
                            ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-xs scale-105'
                            : 'bg-emerald-50 border-emerald-200 text-[#248A3D] hover:scale-105'
                        }`}
                      >
                        <span className="text-xs font-semibold font-mono">{pos.positionCode}</span>
                        <span className="text-[9px] mt-1 font-semibold">
                          {isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Confirm & Odometer */}
            {step === 3 && selectedTruck && selectedPos && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
                    Langkah 3: Konfirmasi Pemasangan
                  </h4>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-[#007AFF] hover:underline"
                  >
                    &larr; Ganti Posisi
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#6E6E73]">Ban Target:</span>
                    <span className="font-semibold text-[#1D1D1F] font-mono">
                      {tireCode} ({serialNumber})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6E73]">Truck:</span>
                    <span className="font-semibold text-[#1D1D1F]">
                      {selectedTruck.policeNumber} ({selectedTruck.truckCode})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6E73]">Posisi Roda:</span>
                    <span className="font-semibold text-[#007AFF] font-mono">
                      {selectedPos.positionCode} ({selectedPos.positionName})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Odometer Pemasangan (KM) *
                  </label>
                  <input
                    type="number"
                    value={installedKm}
                    onChange={(e) => setInstalledKm(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono"
                  />
                  <p className="text-[10px] text-[#6E6E73] mt-1">
                    Default sesuai odometer terkini truck ({selectedTruck.totalKm.toLocaleString()} KM)
                  </p>
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
                    onClick={handleConfirm}
                    disabled={loading}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {loading ? 'Memproses...' : 'Konfirmasi Pemasangan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
