'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit3, X, AlertCircle, Check, DollarSign, Truck, Calendar, MapPin } from 'lucide-react'
import { updateTripContractAction } from '@/app/actions/contractActions'
import { formatCurrency } from '@/lib/utils/format'

interface EditContractCostsModalProps {
  contract: any
  customers?: Array<{ id: string; name: string }>
  trucks?: Array<{ id: string; policeNumber: string; brand: string; model: string }>
  drivers?: Array<{ id: string; driverCode: string; name: string; status?: string }>
  triggerText?: string
  buttonClassName?: string
}

export function EditContractCostsModal({
  contract,
  customers = [],
  trucks = [],
  drivers = [],
  triggerText = 'Edit Kontrak & Nilai (ERP 1 & 2)',
  buttonClassName = 'px-4 py-2.5 rounded-xl bg-[#FF9500] hover:bg-[#E08200] text-white font-semibold text-xs shadow-2xs transition-colors inline-flex items-center gap-2',
}: EditContractCostsModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'REVENUE' | 'GENERAL' | 'COSTS'>('REVENUE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const outLeg = contract.legs?.find((l: any) => l.legNumber === 1) || contract.legs?.[0]
  const retLeg = contract.legs?.find((l: any) => l.legNumber === 2) || contract.legs?.[1]

  // Header State
  const [customerId, setCustomerId] = useState<string>('')
  const [truckId, setTruckId] = useState<string>('')
  const [driverId, setDriverId] = useState<string>('')
  const [driverName, setDriverName] = useState<string>('')
  const [isManualDriver, setIsManualDriver] = useState<boolean>(false)
  const [startDate, setStartDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // ERP 1 Outbound State
  const [outboundValue, setOutboundValue] = useState<string>('0')
  const [outboundOrigin, setOutboundOrigin] = useState<string>('')
  const [outboundDest, setOutboundDest] = useState<string>('')
  const [outboundCargo, setOutboundCargo] = useState<string>('')
  const [outboundWeight, setOutboundWeight] = useState<string>('0')
  const [outboundDistance, setOutboundDistance] = useState<string>('0')
  const [outboundToll, setOutboundToll] = useState<string>('0')
  const [outboundFuel, setOutboundFuel] = useState<string>('0')
  const [outboundInap, setOutboundInap] = useState<string>('0')

  // ERP 2 Return State
  const [returnValue, setReturnValue] = useState<string>('0')
  const [returnOrigin, setReturnOrigin] = useState<string>('')
  const [returnDest, setReturnDest] = useState<string>('')
  const [returnCargo, setReturnCargo] = useState<string>('')
  const [returnWeight, setReturnWeight] = useState<string>('0')
  const [returnDistance, setReturnDistance] = useState<string>('0')
  const [returnToll, setReturnToll] = useState<string>('0')
  const [returnFuel, setReturnFuel] = useState<string>('0')
  const [returnInap, setReturnInap] = useState<string>('0')

  function handleOpen() {
    setCustomerId(contract.customerId || contract.customer?.id || '')
    setTruckId(contract.truckId || contract.truck?.id || '')
    setDriverId(contract.driverId || '')
    setDriverName(contract.driverName || '')
    setIsManualDriver(!contract.driverId)
    setStartDate(
      contract.startDate
        ? new Date(contract.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    )
    setNotes(contract.notes || '')

    // Outbound Leg
    setOutboundValue(outLeg?.contractValue ? String(outLeg.contractValue) : '0')
    setOutboundOrigin(outLeg?.origin || '')
    setOutboundDest(outLeg?.destination || '')
    setOutboundCargo(outLeg?.cargoType || '')
    setOutboundWeight(outLeg?.cargoWeightTon ? String(outLeg.cargoWeightTon) : '0')
    setOutboundDistance(outLeg?.distanceKm ? String(outLeg.distanceKm) : '0')
    setOutboundToll(outLeg?.tollCost ? String(outLeg.tollCost) : '0')
    setOutboundFuel(outLeg?.fuelCost ? String(outLeg.fuelCost) : '0')
    setOutboundInap(outLeg?.otherCost ? String(outLeg.otherCost) : '0')

    // Return Leg
    setReturnValue(retLeg?.contractValue ? String(retLeg.contractValue) : '0')
    setReturnOrigin(retLeg?.origin || '')
    setReturnDest(retLeg?.destination || '')
    setReturnCargo(retLeg?.cargoType || '')
    setReturnWeight(retLeg?.cargoWeightTon ? String(retLeg.cargoWeightTon) : '0')
    setReturnDistance(retLeg?.distanceKm ? String(retLeg.distanceKm) : '0')
    setReturnToll(retLeg?.tollCost ? String(retLeg.tollCost) : '0')
    setReturnFuel(retLeg?.fuelCost ? String(retLeg.fuelCost) : '0')
    setReturnInap(retLeg?.otherCost ? String(retLeg.otherCost) : '0')

    setError(null)
    setActiveTab('REVENUE')
    setIsOpen(true)
  }

  // Calculated Preview Metrics
  const valOut = Number(outboundValue) || 0
  const valRet = Number(returnValue) || 0
  const totalContractRevenue = valOut + valRet
  const taxDeduction = totalContractRevenue * 0.02
  const netContractValue = totalContractRevenue * 0.98
  const driverAllocation = netContractValue * 0.53
  const companyAllocation = netContractValue * 0.47

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!outLeg || !retLeg) {
      setError('Leg perjalanan tidak valid.')
      return
    }

    const selDriver = drivers.find((d) => d.id === driverId)
    const finalDriverName = isManualDriver ? driverName : selDriver?.name || driverName

    if (!finalDriverName) {
      setError('Nama Supir wajib diisi.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await updateTripContractAction({
        contractId: contract.id,
        customerId: customerId || contract.customerId,
        truckId: truckId || contract.truckId,
        driverId: !isManualDriver && driverId ? driverId : undefined,
        driverName: finalDriverName,
        startDate: startDate || new Date().toISOString().split('T')[0],
        notes: notes || undefined,
        outboundLeg: {
          id: outLeg.id,
          origin: outboundOrigin,
          destination: outboundDest,
          cargoType: outboundCargo,
          cargoWeightTon: Number(outboundWeight) || 0,
          distanceKm: Number(outboundDistance) || 0,
          contractValue: valOut,
          tollCost: Number(outboundToll) || 0,
          fuelCost: Number(outboundFuel) || 0,
          otherCost: Number(outboundInap) || 0,
          customerId: customerId || contract.customerId,
        },
        returnLeg: {
          id: retLeg.id,
          origin: returnOrigin,
          destination: returnDest,
          cargoType: returnCargo,
          cargoWeightTon: Number(returnWeight) || 0,
          distanceKm: Number(returnDistance) || 0,
          contractValue: valRet,
          tollCost: Number(returnToll) || 0,
          fuelCost: Number(returnFuel) || 0,
          otherCost: Number(returnInap) || 0,
          customerId: customerId || contract.customerId,
        },
      })

      if (res.error) {
        setError(res.error)
        return
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan perubahan kontrak.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={buttonClassName}>
        <Edit3 className="w-4 h-4" />
        {triggerText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-black/[0.08] shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">
                  KONTRAK {contract.contractNumber}
                </span>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Edit Detail Kontrak &amp; Nilai Perjalanan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#FF3B30] text-xs flex items-center gap-2 font-semibold shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Live Financial Waterfall Summary */}
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-2 text-xs shrink-0">
              <div className="flex items-center justify-between font-semibold border-b border-black/[0.06] pb-2">
                <span className="text-[#1D1D1F]">Total Nilai Kontrak (ERP 1 + ERP 2):</span>
                <span className="text-[#34C759] text-sm">{formatCurrency(totalContractRevenue)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#6E6E73]">
                <div>
                  Potongan 2%: <strong className="text-[#FF3B30] font-semibold">{formatCurrency(taxDeduction)}</strong>
                </div>
                <div>
                  Net (98%): <strong className="text-[#248A3D] font-semibold">{formatCurrency(netContractValue)}</strong>
                </div>
                <div>
                  Bagian Supir (53%): <strong className="text-[#C67300] font-semibold">{formatCurrency(driverAllocation)}</strong>
                </div>
                <div>
                  Perusahaan (47%): <strong className="text-[#007AFF] font-semibold">{formatCurrency(companyAllocation)}</strong>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('REVENUE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'REVENUE'
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Nilai Kontrak &amp; Rute
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('GENERAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'GENERAL'
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <Truck className="w-3.5 h-3.5" /> Supir, Armada &amp; Tanggal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('COSTS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'COSTS'
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Biaya Operasional
              </button>
            </div>

            {/* Form Body - Scrollable */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* TAB 1: NILAI KONTRAK & RUTE */}
              {activeTab === 'REVENUE' && (
                <div className="space-y-4">
                  {/* ERP 1 Outbound */}
                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                      <span className="font-bold text-[#007AFF] uppercase text-[11px] tracking-wider">
                        ERP 1 · BERANGKAT (OUTBOUND)
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1D1D1F] mb-1">
                        Nilai Kontrak / Omset ERP 1 (Rp) *
                      </label>
                      <input
                        type="number"
                        value={outboundValue}
                        onChange={(e) => setOutboundValue(e.target.value)}
                        placeholder="Contoh: 5500000"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-black/[0.12] font-semibold text-sm text-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Kota Asal</label>
                        <input
                          type="text"
                          value={outboundOrigin}
                          onChange={(e) => setOutboundOrigin(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Kota Tujuan</label>
                        <input
                          type="text"
                          value={outboundDest}
                          onChange={(e) => setOutboundDest(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Jenis Muatan</label>
                        <input
                          type="text"
                          value={outboundCargo}
                          onChange={(e) => setOutboundCargo(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Berat (Ton)</label>
                        <input
                          type="number"
                          value={outboundWeight}
                          onChange={(e) => setOutboundWeight(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Jarak (KM)</label>
                        <input
                          type="number"
                          value={outboundDistance}
                          onChange={(e) => setOutboundDistance(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ERP 2 Return */}
                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                      <span className="font-bold text-[#34C759] uppercase text-[11px] tracking-wider">
                        ERP 2 · PULANG (RETURN)
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1D1D1F] mb-1">
                        Nilai Kontrak / Omset ERP 2 (Rp) *
                      </label>
                      <input
                        type="number"
                        value={returnValue}
                        onChange={(e) => setReturnValue(e.target.value)}
                        placeholder="Contoh: 8000000"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-black/[0.12] font-semibold text-sm text-[#34C759] focus:ring-2 focus:ring-[#34C759]/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Kota Asal</label>
                        <input
                          type="text"
                          value={returnOrigin}
                          onChange={(e) => setReturnOrigin(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Kota Tujuan</label>
                        <input
                          type="text"
                          value={returnDest}
                          onChange={(e) => setReturnDest(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Jenis Muatan</label>
                        <input
                          type="text"
                          value={returnCargo}
                          onChange={(e) => setReturnCargo(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Berat (Ton)</label>
                        <input
                          type="number"
                          value={returnWeight}
                          onChange={(e) => setReturnWeight(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Jarak (KM)</label>
                        <input
                          type="number"
                          value={returnDistance}
                          onChange={(e) => setReturnDistance(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DATA UTAMA */}
              {activeTab === 'GENERAL' && (
                <div className="space-y-4">
                  {customers.length > 0 && (
                    <div>
                      <label className="block font-semibold text-[#1D1D1F] mb-1">Pelanggan (Customer)</label>
                      <select
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                      >
                        <option value="">-- Pilih Customer --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {trucks.length > 0 && (
                    <div>
                      <label className="block font-semibold text-[#1D1D1F] mb-1">Truck Armada</label>
                      <select
                        value={truckId}
                        onChange={(e) => setTruckId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                      >
                        <option value="">-- Pilih Truck --</option>
                        {trucks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.policeNumber} ({t.brand} {t.model})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-[#1D1D1F]">Supir Armada</label>
                      {drivers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualDriver(!isManualDriver)
                            setDriverId('')
                          }}
                          className="text-[11px] font-semibold text-[#007AFF] hover:underline"
                        >
                          {isManualDriver ? '← Pilih Master Driver' : '+ Input Manual Teks'}
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
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                      >
                        <option value="">-- Pilih Driver Armada --</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.driverCode ? `[${d.driverCode}] ` : ''}{d.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="Contoh: Pak Dayat"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1">Tanggal Mulai Kontrak</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1">Catatan Tambahan</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: BIAYA OPERASIONAL */}
              {activeTab === 'COSTS' && (
                <div className="space-y-4">
                  {/* Outbound Costs */}
                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3">
                    <span className="font-bold text-[#007AFF] uppercase text-[11px] tracking-wider block">
                      BIAYA ERP 1 · BERANGKAT
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Tol (Rp)</label>
                        <input
                          type="number"
                          value={outboundToll}
                          onChange={(e) => setOutboundToll(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Inap (Rp)</label>
                        <input
                          type="number"
                          value={outboundInap}
                          onChange={(e) => setOutboundInap(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">BBM (Rp)</label>
                        <input
                          type="number"
                          value={outboundFuel}
                          onChange={(e) => setOutboundFuel(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Return Costs */}
                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3">
                    <span className="font-bold text-[#34C759] uppercase text-[11px] tracking-wider block">
                      BIAYA ERP 2 · PULANG
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Tol (Rp)</label>
                        <input
                          type="number"
                          value={returnToll}
                          onChange={(e) => setReturnToll(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">Inap (Rp)</label>
                        <input
                          type="number"
                          value={returnInap}
                          onChange={(e) => setReturnInap(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1D1D1F] mb-1">BBM (Rp)</label>
                        <input
                          type="number"
                          value={returnFuel}
                          onChange={(e) => setReturnFuel(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06] shrink-0">
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
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan Kontrak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
