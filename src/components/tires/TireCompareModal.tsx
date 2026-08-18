'use client'

import React, { useState } from 'react'
import { formatCurrency, formatKm, formatPercent } from '@/lib/utils/format'
import { Disc, X, Columns } from 'lucide-react'

interface TireCompareModalProps {
  tires: Array<{
    id: string
    tireCode: string
    brand: string
    model: string
    size: string
    serialNumber: string
    purchasePrice: number | null
    currentKm: number
    expectedLifetimeKm: number
    remainingLifetimeKm: number
    status: string
  }>
}

export function TireCompareModal({ tires }: TireCompareModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  function toggleSelect(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id])
      }
    }
  }

  const selectedTires = tires.filter((t) => selectedIds.includes(t.id))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] bg-white hover:bg-[#F5F5F7] rounded-xl border border-black/[0.08] transition-all flex items-center gap-1.5 shadow-2xs"
      >
        <Columns className="w-4 h-4 text-[#007AFF]" /> Komparasi Performa Ban
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 border border-black/[0.08] shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <Disc className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Komparasi Performa &amp; Lifecycle Ban
                  </h3>
                  <p className="text-xs text-[#6E6E73]">Pilih hingga 4 ban untuk membandingkan efisiensi dan keausan.</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tire Selector Bar */}
            <div className="mb-6 space-y-2">
              <label className="block text-xs font-semibold text-[#1D1D1F]">
                Pilih Ban dari Database ({selectedIds.length}/4 Dipilih):
              </label>
              <div className="flex flex-wrap gap-2">
                {tires.map((t) => {
                  const isSelected = selectedIds.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleSelect(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-2xs'
                          : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/[0.08] hover:bg-[#E5E5EA]'
                      }`}
                    >
                      {t.tireCode} ({t.brand})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Comparison Matrix Table */}
            {selectedTires.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8E8E93] border border-dashed border-black/[0.08] rounded-xl">
                Pilih setidaknya 1 ban di atas untuk melihat komparasi spesifikasi dan performa.
              </div>
            ) : (
              <div className="overflow-x-auto border border-black/[0.06] rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAFA] border-b border-black/[0.06] font-semibold text-[#6E6E73] uppercase tracking-wider">
                      <th className="p-3 border-r border-black/[0.06] w-44">Parameter</th>
                      {selectedTires.map((t) => (
                        <th key={t.id} className="p-3 border-r border-black/[0.06] font-mono text-[#007AFF]">
                          {t.tireCode}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] font-medium">
                    <tr>
                      <td className="p-3 bg-[#FAFAFA] font-semibold text-[#6E6E73] border-r border-black/[0.06]">
                        Merk &amp; Model
                      </td>
                      {selectedTires.map((t) => (
                        <td key={t.id} className="p-3 font-semibold text-[#1D1D1F] border-r border-black/[0.06]">
                          {t.brand} {t.model}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 bg-[#FAFAFA] font-semibold text-[#6E6E73] border-r border-black/[0.06]">
                        Ukuran &amp; SN
                      </td>
                      {selectedTires.map((t) => (
                        <td key={t.id} className="p-3 font-mono text-[#1D1D1F] border-r border-black/[0.06]">
                          {t.size} (SN: {t.serialNumber})
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 bg-[#FAFAFA] font-semibold text-[#6E6E73] border-r border-black/[0.06]">
                        Harga Pembelian
                      </td>
                      {selectedTires.map((t) => (
                        <td key={t.id} className="p-3 font-semibold text-[#1D1D1F] border-r border-black/[0.06]">
                          {formatCurrency(t.purchasePrice)}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 bg-[#FAFAFA] font-semibold text-[#6E6E73] border-r border-black/[0.06]">
                        Pemakaian Saat Ini
                      </td>
                      {selectedTires.map((t) => (
                        <td key={t.id} className="p-3 font-mono font-semibold text-[#1D1D1F] border-r border-black/[0.06]">
                          {formatKm(t.currentKm)}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 bg-[#FAFAFA] font-semibold text-[#6E6E73] border-r border-black/[0.06]">
                        Sisa Usia Lifetime
                      </td>
                      {selectedTires.map((t) => (
                        <td key={t.id} className="p-3 font-mono font-semibold text-[#248A3D] border-r border-black/[0.06]">
                          {formatKm(t.remainingLifetimeKm)}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 bg-[#FAFAFA] font-semibold text-[#6E6E73] border-r border-black/[0.06]">
                        Persentase Keausan (%)
                      </td>
                      {selectedTires.map((t) => {
                        const pct = t.expectedLifetimeKm > 0 ? (t.currentKm / t.expectedLifetimeKm) * 100 : 0
                        return (
                          <td key={t.id} className="p-3 font-mono font-semibold border-r border-black/[0.06]">
                            {formatPercent(pct)}
                          </td>
                        )
                      })}
                    </tr>

                    <tr>
                      <td className="p-3 bg-[#FAFAFA] font-semibold text-[#6E6E73] border-r border-black/[0.06]">
                        Estimasi Biaya / KM
                      </td>
                      {selectedTires.map((t) => {
                        const costKm = t.purchasePrice && t.currentKm > 0 ? t.purchasePrice / t.currentKm : null
                        return (
                          <td key={t.id} className="p-3 font-mono font-semibold text-[#1D1D1F] border-r border-black/[0.06]">
                            {costKm !== null ? formatCurrency(costKm) : 'Not enough data'}
                          </td>
                        )
                      })}
                    </tr>

                    <tr>
                      <td className="p-3 bg-[#FAFAFA] font-semibold text-[#6E6E73] border-r border-black/[0.06]">
                        Status Health
                      </td>
                      {selectedTires.map((t) => (
                        <td key={t.id} className="p-3 font-semibold border-r border-black/[0.06]">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                            {t.status}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
