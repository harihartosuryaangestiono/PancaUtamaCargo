'use client'

import React, { useState } from 'react'
import { rotateTireAction } from '@/app/actions/tireActions'
import { RotateCw, X, Check } from 'lucide-react'

interface RotateTireModalProps {
  tireId: string
  tireCode: string
  currentPositionCode: string
  truckId: string
  currentTruckKm: number
  availablePositions: Array<{
    id: string
    positionCode: string
    positionName: string
    currentTireId: string | null
  }>
}

export function RotateTireModal({
  tireId,
  tireCode,
  currentPositionCode,
  currentTruckKm,
  availablePositions,
}: RotateTireModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedPosId, setSelectedPosId] = useState<string>('')
  const [kmAtRotation, setKmAtRotation] = useState<number>(currentTruckKm)
  const [reason, setReason] = useState<string>('Rotasi Rutin Roda')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emptyPositions = availablePositions.filter((p) => !p.currentTireId)

  async function handleConfirm() {
    if (!selectedPosId) return
    setLoading(true)
    setError(null)

    try {
      const res = await rotateTireAction({
        tireId,
        newWheelPositionId: selectedPosId,
        kmAtRotation,
        reason,
      })
      if (res?.success) {
        setOpen(false)
      }
    } catch (err: any) {
      setError(err.message || 'Gagal merotasi ban.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-xl border border-black/[0.08] transition-all flex items-center gap-1.5 shadow-2xs"
      >
        <RotateCw className="w-3.5 h-3.5 text-[#007AFF]" /> Rotasi Ban
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-black/[0.08] shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Rotasi Ban ({tireCode})
                  </h3>
                  <p className="text-xs text-[#6E6E73] font-mono">
                    Posisi Saat Ini: <span className="font-semibold text-[#007AFF]">{currentPositionCode}</span>
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

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-[#FF3B30] text-xs font-semibold border border-rose-200">
                {error}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Pilih Posisi Tujuan Baru *
                </label>
                {emptyPositions.length === 0 ? (
                  <p className="text-xs text-[#FF9500] bg-amber-50 p-3 rounded-xl border border-amber-200 font-semibold">
                    Semua posisi roda lainnya pada truck ini sedang terisi. Lepaskan ban pada posisi tujuan terlebih dahulu.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {emptyPositions.map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => setSelectedPosId(pos.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedPosId === pos.id
                            ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-2xs'
                            : 'bg-[#FAFAFA] border-black/[0.06] text-[#1D1D1F] hover:bg-[#F5F5F7]'
                        }`}
                      >
                        <p className="text-xs font-semibold font-mono">{pos.positionCode}</p>
                        <p className="text-[10px] opacity-80 mt-0.5">{pos.positionName}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Odometer Saat Rotasi (KM) *
                </label>
                <input
                  type="number"
                  value={kmAtRotation}
                  onChange={(e) => setKmAtRotation(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Alasan Rotasi
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Pemerataan keausan tapak ban"
                  className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                />
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
                  disabled={loading || !selectedPosId}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Memproses...' : 'Konfirmasi Rotasi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
