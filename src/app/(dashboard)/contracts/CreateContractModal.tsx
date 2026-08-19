'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Check, AlertCircle } from 'lucide-react'
import { createTripContractAction } from '@/app/actions/contractActions'
import { formatCurrency } from '@/lib/utils/format'

interface CreateContractModalProps {
  customers: Array<{ id: string; name: string }>
  trucks: Array<{ id: string; policeNumber: string; brand: string; model: string }>
  drivers?: Array<{ id: string; driverCode: string; name: string; status?: string }>
}

export function CreateContractModal({ customers, trucks, drivers = [] }: CreateContractModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [customerId, setCustomerId] = useState('')
  const [truckId, setTruckId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [driverName, setDriverName] = useState('')
  const [isManualDriver, setIsManualDriver] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  // ERP 1 Outbound
  const [outCustomerId, setOutCustomerId] = useState('')
  const [outOrigin, setOutOrigin] = useState('Magelang')
  const [outDest, setOutDest] = useState('Surabaya')
  const [outCargo, setOutCargo] = useState('Plywood')
  const [outWeight, setOutWeight] = useState('35')
  const [outDistance, setOutDistance] = useState('380')
  const [outValue, setOutValue] = useState('5500000')
  const [outToll, setOutToll] = useState('600000')
  const [outFuel, setOutFuel] = useState('1200000')
  const [outInap, setOutInap] = useState('0')

  // ERP 2 Return
  const [retCustomerId, setRetCustomerId] = useState('')
  const [retOrigin, setRetOrigin] = useState('Surabaya')
  const [retDest, setRetDest] = useState('Magelang')
  const [retCargo, setRetCargo] = useState('Besi Siku')
  const [retWeight, setRetWeight] = useState('40')
  const [retDistance, setRetDistance] = useState('380')
  const [retValue, setRetValue] = useState('6000000')
  const [retToll, setRetToll] = useState('600000')
  const [retFuel, setRetFuel] = useState('1200000')
  const [retInap, setRetInap] = useState('0')

  // Driver Advance
  const [driverAdvance, setDriverAdvance] = useState('3000000')

  function resetForm() {
    setStep(1)
    setError(null)
    setCustomerId('')
    setOutCustomerId('')
    setRetCustomerId('')
    setTruckId('')
    setDriverId('')
    setDriverName('')
    setIsManualDriver(false)
  }

  async function handleSubmit() {
    try {
      setLoading(true)
      setError(null)

      const selectedDriver = drivers.find((d) => d.id === driverId)
      const finalDriverName = isManualDriver ? driverName : (selectedDriver?.name || driverName)

      const res = await createTripContractAction({
        customerId,
        truckId,
        driverId: !isManualDriver && driverId ? driverId : undefined,
        driverName: finalDriverName,
        startDate,
        notes,
        driverAdvanceAmount: Number(driverAdvance) || 3000000,
        outboundLeg: {
          customerId: outCustomerId || customerId,
          origin: outOrigin,
          destination: outDest,
          cargoType: outCargo,
          cargoWeightTon: Number(outWeight) || 0,
          distanceKm: Number(outDistance) || 0,
          contractValue: Number(outValue) || 0,
          tollCost: Number(outToll) || 0,
          fuelCost: Number(outFuel) || 0,
          otherCost: Number(outInap) || 0,
        },
        returnLeg: {
          customerId: retCustomerId || customerId,
          origin: retOrigin,
          destination: retDest,
          cargoType: retCargo,
          cargoWeightTon: Number(retWeight) || 0,
          distanceKm: Number(retDistance) || 0,
          contractValue: Number(retValue) || 0,
          tollCost: Number(retToll) || 0,
          fuelCost: Number(retFuel) || 0,
          otherCost: Number(retInap) || 0,
        },
      })

      if (res.error) {
        setError(res.error)
        return
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal membuat kontrak perjalanan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true)
          resetForm()
        }}
        className="px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold text-xs shadow-2xs transition-all inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Buat Kontrak Perjalanan (Round Trip)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-black/[0.08] shadow-2xl space-y-6 text-[#1D1D1F]">
            {/* Wizard Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">
                  WIZARD STEP {step} OF 5
                </span>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  {step === 1 && 'Step 1: Data Kontrak & Armada'}
                  {step === 2 && 'Step 2: ERP 1 — Rute Berangkat (Outbound)'}
                  {step === 3 && 'Step 3: ERP 2 — Rute Pulang (Return)'}
                  {step === 4 && 'Step 4: Uang Jalan Supir (Driver Advance)'}
                  {step === 5 && 'Step 5: Review & Konfirmasi Kontrak'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-[#FF3B30] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: General Info */}
            {step === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Pelanggan (Customer) *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
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
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Truck Armada *</label>
                  <select
                    value={truckId}
                    onChange={(e) => setTruckId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  >
                    <option value="">-- Pilih Truck --</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.policeNumber} ({t.brand} {t.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-[#1D1D1F]">Pengemudi Armada (Driver) *</label>
                    {drivers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualDriver(!isManualDriver)
                          setDriverId('')
                          setDriverName('')
                        }}
                        className="text-[11px] font-semibold text-[#007AFF] hover:underline"
                      >
                        {isManualDriver ? '← Pilih dari Master Driver' : '+ Input Manual Teks'}
                      </button>
                    )}
                  </div>

                  {!isManualDriver && drivers.length > 0 ? (
                    <select
                      value={driverId}
                      onChange={(e) => {
                        const selId = e.target.value
                        setDriverId(selId)
                        const d = drivers.find((drv) => drv.id === selId)
                        if (d) setDriverName(d.name)
                        else setDriverName('')
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                    >
                      <option value="">-- Pilih Driver Armada --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.driverCode ? `[${d.driverCode}] ` : ''}{d.name} {d.status && d.status !== 'ACTIVE' ? `(${d.status})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Tanggal Mulai Kontrak</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  />
                </div>
              </div>
            )}

            {/* Step 2: ERP 1 */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="col-span-2">
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Customer / Client Leg 1 (Arah Berangkat)</label>
                  <select
                    value={outCustomerId}
                    onChange={(e) => setOutCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium"
                  >
                    <option value="">-- Sama Dengan Customer Utama Kontrak --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Kota Asal (Origin)</label>
                  <input type="text" value={outOrigin} onChange={(e) => setOutOrigin(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Kota Tujuan (Destination)</label>
                  <input type="text" value={outDest} onChange={(e) => setOutDest(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Jenis Muatan</label>
                  <input type="text" value={outCargo} onChange={(e) => setOutCargo(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Berat Muatan (Ton)</label>
                  <input type="number" value={outWeight} onChange={(e) => setOutWeight(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Nilai Kontrak ERP 1 (Rp)</label>
                  <input type="number" value={outValue} onChange={(e) => setOutValue(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Estimasi Jarak (KM)</label>
                  <input type="number" value={outDistance} onChange={(e) => setOutDistance(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya Tol ERP 1 (Rp)</label>
                  <input type="number" value={outToll} onChange={(e) => setOutToll(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya Inap ERP 1 (Rp)</label>
                  <input type="number" value={outInap} onChange={(e) => setOutInap(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya BBM ERP 1 (Rp)</label>
                  <input type="number" value={outFuel} onChange={(e) => setOutFuel(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
              </div>
            )}

            {/* Step 3: ERP 2 */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="col-span-2">
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Customer / Client Leg 2 (Arah Pulang)</label>
                  <select
                    value={retCustomerId}
                    onChange={(e) => setRetCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium"
                  >
                    <option value="">-- Sama Dengan Customer Utama Kontrak --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Kota Asal (Origin)</label>
                  <input type="text" value={retOrigin} onChange={(e) => setRetOrigin(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Kota Tujuan (Destination)</label>
                  <input type="text" value={retDest} onChange={(e) => setRetDest(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Jenis Muatan Pulang</label>
                  <input type="text" value={retCargo} onChange={(e) => setRetCargo(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Berat Muatan (Ton)</label>
                  <input type="number" value={retWeight} onChange={(e) => setRetWeight(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Nilai Kontrak ERP 2 (Rp)</label>
                  <input type="number" value={retValue} onChange={(e) => setRetValue(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Estimasi Jarak (KM)</label>
                  <input type="number" value={retDistance} onChange={(e) => setRetDistance(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya Tol ERP 2 (Rp)</label>
                  <input type="number" value={retToll} onChange={(e) => setRetToll(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya Inap ERP 2 (Rp)</label>
                  <input type="number" value={retInap} onChange={(e) => setRetInap(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Biaya BBM ERP 2 (Rp)</label>
                  <input type="number" value={retFuel} onChange={(e) => setRetFuel(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium" />
                </div>
              </div>
            )}

            {/* Step 4: Driver Advance */}
            {step === 4 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/20">
                  <h4 className="font-semibold text-[#007AFF] text-sm">Ketentuan Uang Jalan (Driver Advance)</h4>
                  <p className="text-[#6E6E73] mt-1 leading-relaxed">
                    Uang jalan adalah dana awal operasional yang diberikan kepada supir ({driverName || 'Supir'}) sebelum armada berangkat. Totalan akhir akan diperhitungkan saat perjalanan selesai.
                  </p>
                </div>
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Nominal Uang Jalan (Rp)</label>
                  <input
                    type="number"
                    value={driverAdvance}
                    onChange={(e) => setDriverAdvance(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-bold text-sm text-[#1D1D1F]"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3">
                  <h4 className="font-semibold text-[#1D1D1F]">Ringkasan Perhitungan Kontrak Round-Trip</h4>
                  {(() => {
                    const grossTotal = Number(outValue) + Number(retValue)
                    const taxDeduction = grossTotal * 0.02
                    const netReceived = grossTotal * 0.98
                    const driverShare = netReceived * 0.53
                    const companyShare = netReceived * 0.47
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-[#6E6E73] block">ERP 1 Berangkat ({outOrigin} &rarr; {outDest})</span>
                          <span className="font-semibold text-[#1D1D1F]">{formatCurrency(Number(outValue))}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#6E6E73] block">ERP 2 Pulang ({retOrigin} &rarr; {retDest})</span>
                          <span className="font-semibold text-[#1D1D1F]">{formatCurrency(Number(retValue))}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#6E6E73] block">Total Kontrak Kotor</span>
                          <span className="font-semibold text-[#1D1D1F]">{formatCurrency(grossTotal)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#FF3B30] block">Potongan 2%</span>
                          <span className="font-semibold text-[#FF3B30]">-{formatCurrency(taxDeduction)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#248A3D] block">Total Diterima (98%)</span>
                          <span className="font-semibold text-[#248A3D]">{formatCurrency(netReceived)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#007AFF] block">Bagian Supir (53% dari Net)</span>
                          <span className="font-semibold text-[#007AFF]">{formatCurrency(driverShare)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#5856D6] block">Bagian Perusahaan (47% dari Net)</span>
                          <span className="font-semibold text-[#5856D6]">{formatCurrency(companyShare)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#FF9500] block">Uang Jalan Supir</span>
                          <span className="font-semibold text-[#FF9500]">{formatCurrency(Number(driverAdvance))}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-black/[0.06]">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] transition-colors"
                >
                  &larr; Kembali
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && (!customerId || !truckId || !driverName)) {
                      setError('Customer, Truck, dan Supir wajib diisi.')
                      return
                    }
                    setError(null)
                    setStep((s) => (s + 1) as any)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#007AFF] hover:bg-[#0062CC] text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  Lanjut &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#34C759] hover:bg-[#28A745] text-white inline-flex items-center gap-2 shadow-xs disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" /> {loading ? 'Memproses...' : 'Konfirmasi & Buat Kontrak'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
