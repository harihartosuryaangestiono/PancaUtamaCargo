'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit3, X, AlertCircle, Check } from 'lucide-react'
import { updateContractOperationalCostsAction } from '@/app/actions/contractActions'
import { formatCurrency } from '@/lib/utils/format'

interface EditContractCostsModalProps {
  contract: any
  triggerText?: string
  buttonClassName?: string
}

export function EditContractCostsModal({
  contract,
  triggerText = 'Edit Biaya Operasional',
  buttonClassName = 'px-3.5 py-1.5 rounded-xl bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 border border-[#007AFF]/20 text-xs font-semibold transition-all inline-flex items-center gap-1.5',
}: EditContractCostsModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const outLeg = contract.legs?.find((l: any) => l.legNumber === 1) || contract.legs?.[0]
  const retLeg = contract.legs?.find((l: any) => l.legNumber === 2) || contract.legs?.[1]

  const [outboundToll, setOutboundToll] = useState<string>(outLeg?.tollCost ? String(outLeg.tollCost) : '0')
  const [outboundFuel, setOutboundFuel] = useState<string>(outLeg?.fuelCost ? String(outLeg.fuelCost) : '0')
  const [outboundInap, setOutboundInap] = useState<string>(outLeg?.otherCost ? String(outLeg.otherCost) : '0')

  const [returnToll, setReturnToll] = useState<string>(retLeg?.tollCost ? String(retLeg.tollCost) : '0')
  const [returnFuel, setReturnFuel] = useState<string>(retLeg?.fuelCost ? String(retLeg.fuelCost) : '0')
  const [returnInap, setReturnInap] = useState<string>(retLeg?.otherCost ? String(retLeg.otherCost) : '0')

  function handleOpen() {
    setOutboundToll(outLeg?.tollCost ? String(outLeg.tollCost) : '0')
    setOutboundFuel(outLeg?.fuelCost ? String(outLeg.fuelCost) : '0')
    setOutboundInap(outLeg?.otherCost ? String(outLeg.otherCost) : '0')

    setReturnToll(retLeg?.tollCost ? String(retLeg.tollCost) : '0')
    setReturnFuel(retLeg?.fuelCost ? String(retLeg.fuelCost) : '0')
    setReturnInap(retLeg?.otherCost ? String(retLeg.otherCost) : '0')

    setError(null)
    setIsOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!outLeg || !retLeg) return

    try {
      setLoading(true)
      setError(null)

      const res = await updateContractOperationalCostsAction({
        contractId: contract.id,
        outboundLegId: outLeg.id,
        outboundTollCost: Number(outboundToll) || 0,
        outboundFuelCost: Number(outboundFuel) || 0,
        outboundInapCost: Number(outboundInap) || 0,
        returnLegId: retLeg.id,
        returnTollCost: Number(returnToll) || 0,
        returnFuelCost: Number(returnFuel) || 0,
        returnInapCost: Number(returnInap) || 0,
      })

      if (res.error) {
        setError(res.error)
        return
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal merubah biaya operasional.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={buttonClassName}>
        <Edit3 className="w-3.5 h-3.5" />
        {triggerText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-black/[0.08] shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5">
              <div>
                <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">
                  KONTRAK {contract.contractNumber}
                </span>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Edit Biaya Operasional (Tol, Inap, Bensin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#FF3B30] text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* SECTION 1: ERP 1 OUTBOUND */}
              <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#007AFF] uppercase text-[11px] tracking-wider">
                    ERP 1 · BERANGKAT ({outLeg?.origin} → {outLeg?.destination})
                  </span>
                  <span className="font-mono text-[#6E6E73]">Omset: {formatCurrency(outLeg?.contractValue)}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya Tol (Rp)</label>
                    <input
                      type="number"
                      value={outboundToll}
                      onChange={(e) => setOutboundToll(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya Inap (Rp)</label>
                    <input
                      type="number"
                      value={outboundInap}
                      onChange={(e) => setOutboundInap(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya BBM/Solar (Rp)</label>
                    <input
                      type="number"
                      value={outboundFuel}
                      onChange={(e) => setOutboundFuel(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ERP 2 RETURN */}
              <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#34C759] uppercase text-[11px] tracking-wider">
                    ERP 2 · PULANG ({retLeg?.origin} → {retLeg?.destination})
                  </span>
                  <span className="font-mono text-[#6E6E73]">Omset: {formatCurrency(retLeg?.contractValue)}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya Tol (Rp)</label>
                    <input
                      type="number"
                      value={returnToll}
                      onChange={(e) => setReturnToll(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya Inap (Rp)</label>
                    <input
                      type="number"
                      value={returnInap}
                      onChange={(e) => setReturnInap(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya BBM/Solar (Rp)</label>
                    <input
                      type="number"
                      value={returnFuel}
                      onChange={(e) => setReturnFuel(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-2xs transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan Biaya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
