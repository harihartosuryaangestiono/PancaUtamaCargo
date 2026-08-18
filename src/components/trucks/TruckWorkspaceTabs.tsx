'use client'

import React, { useState } from 'react'
import {
  Truck,
  Disc,
  Package,
  Wrench,
  Fuel,
  DollarSign,
  Activity,
  Tag,
  Plus,
  X,
} from 'lucide-react'
import { MitsubishiChassisViewer } from '@/components/chassis/MitsubishiChassisViewer'
import { installTireAction, removeTireAction } from '@/app/actions/tireActions'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import Link from 'next/link'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface TruckWorkspaceTabsProps {
  truck: any
  healthScore: any
  digitalLogbook: any[]
  availableUnmountedTires: any[]
  userRole: 'OWNER' | 'FINANCE'
}

export function TruckWorkspaceTabs({
  truck,
  healthScore,
  digitalLogbook,
  availableUnmountedTires,
  userRole,
}: TruckWorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Chassis' | 'Ban' | 'Pengiriman' | 'BBM' | 'Maintenance' | 'Sparepart' | 'Keuangan' | 'Activity'
  >('Overview')

  const [installingPos, setInstallingPos] = useState<{ id: string; code: string } | null>(null)
  const [selectedTireId, setSelectedTireId] = useState<string>('')
  const [installedKm, setInstalledKm] = useState<number>(truck.totalKm || 0)
  const [installLoading, setInstallLoading] = useState(false)
  const [installError, setInstallError] = useState<string | null>(null)

  const [removeTireTargetId, setRemoveTireTargetId] = useState<string | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)

  async function handleConfirmInstall(e: React.FormEvent) {
    e.preventDefault()
    if (!installingPos || !selectedTireId) return
    setInstallLoading(true)
    setInstallError(null)

    try {
      await installTireAction({
        tireId: selectedTireId,
        truckId: truck.id,
        wheelPositionId: installingPos.id,
        installedKm,
      })
      setInstallingPos(null)
      setSelectedTireId('')
    } catch (err: any) {
      setInstallError(err.message || 'Gagal memasang ban ke truck.')
    } finally {
      setInstallLoading(false)
    }
  }

  async function handleConfirmRemoveTire() {
    if (!removeTireTargetId) return
    try {
      setRemoveLoading(true)
      await removeTireAction({
        tireId: removeTireTargetId,
        removedKm: truck.totalKm || 0,
        reason: 'Pelepasan dari Chassis Truck',
      })
      setRemoveTireTargetId(null)
    } catch (err: any) {
      alert(err.message || 'Gagal melepaskan ban.')
    } finally {
      setRemoveLoading(false)
    }
  }

  async function handleRemoveTire(tireId: string) {
    setRemoveTireTargetId(tireId)
  }

  const tabs: Array<{ id: typeof activeTab; label: string; icon: any }> = [
    { id: 'Overview', label: 'Overview', icon: Truck },
    { id: 'Chassis', label: 'Interactive Chassis', icon: Disc },
    { id: 'Ban', label: 'Manajemen Ban', icon: Disc },
    { id: 'Pengiriman', label: 'Pengiriman', icon: Package },
    { id: 'BBM', label: 'BBM Intelligence', icon: Fuel },
    { id: 'Maintenance', label: 'Maintenance & Service', icon: Wrench },
    { id: 'Sparepart', label: 'Spareparts Used', icon: Tag },
    { id: 'Keuangan', label: 'Keuangan & Cost', icon: DollarSign },
    { id: 'Activity', label: 'Digital Logbook', icon: Activity },
  ]

  // Formatted wheel positions
  const formattedPositions = truck.wheelPositions.map((pos: any) => ({
    id: pos.id,
    positionCode: pos.positionCode,
    positionName: pos.positionName,
    axleNumber: pos.axleNumber,
    side: pos.side,
    isInner: pos.isInner,
    currentTire: pos.currentTire
      ? {
          id: pos.currentTire.id,
          tireCode: pos.currentTire.tireCode,
          brand: pos.currentTire.brand,
          model: pos.currentTire.model,
          size: pos.currentTire.size,
          serialNumber: pos.currentTire.serialNumber,
          currentKm: pos.currentTire.currentKm,
          expectedLifetimeKm: pos.currentTire.expectedLifetimeKm,
          remainingLifetimeKm: pos.currentTire.remainingLifetimeKm,
          status: pos.currentTire.status,
          condition: pos.currentTire.condition,
          purchasePrice: pos.currentTire.purchasePrice ? Number(pos.currentTire.purchasePrice) : null,
        }
      : null,
  }))

  const contractCount = truck.tripContracts?.length || 0
  const legCount = truck.tripContracts?.reduce((sum: number, c: any) => sum + (c.legs?.length || 2), 0) || 0
  const legacyTrips = truck.shipments?.length || 0
  const totalTrips = Math.max(legacyTrips, legCount || (contractCount * 2))

  let totalRevenue = 0
  let totalOperatingCost = 0

  if (truck.tripContracts && truck.tripContracts.length > 0) {
    for (const c of truck.tripContracts) {
      totalRevenue += Number(c.totalRevenue || 0)
      for (const leg of (c.legs || [])) {
        totalOperatingCost += Number(leg.tollCost || 0) + Number(leg.fuelCost || 0) + Number(leg.otherCost || 0)
      }
    }
  }

  for (const s of (truck.shipments || [])) {
    if (s.revenue) totalRevenue += Number(s.revenue)
    if (s.totalCost) totalOperatingCost += Number(s.totalCost)
  }

  let totalMaintenanceCost = 0
  for (const m of truck.maintenances) {
    if (m.totalCost) totalMaintenanceCost += Number(m.totalCost)
  }

  let totalFuelCost = 0
  for (const f of truck.fuelLogs) {
    if (f.totalCost) totalFuelCost += Number(f.totalCost)
  }

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#F2F2F7] rounded-2xl overflow-x-auto border border-black/[0.06] no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-[#1D1D1F] shadow-2xs border border-black/[0.06]'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <span className="text-[11px] font-medium text-[#6E6E73]">Total KM Odometer</span>
              <p className="text-xl font-semibold text-[#1D1D1F] mt-1">{formatKm(truck.totalKm)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <span className="text-[11px] font-medium text-[#6E6E73]">Health Score 2.0</span>
              <p className="text-xl font-semibold text-[#34C759] mt-1">
                {healthScore.status === 'CALCULATED' ? `${healthScore.score} / 100` : 'Not enough data'}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <span className="text-[11px] font-medium text-[#6E6E73]">Total Pengiriman</span>
              <p className="text-xl font-semibold text-[#1D1D1F] mt-1">{totalTrips} Trip</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <span className="text-[11px] font-medium text-[#6E6E73]">Total Pemasukan</span>
              <p className="text-xl font-semibold text-[#34C759] mt-1">
                {formatCurrency(totalRevenue > 0 ? totalRevenue : null)}
              </p>
            </div>
          </div>

          {/* Health Score Breakdown Card */}
          {healthScore.status === 'CALCULATED' && healthScore.breakdown && (
            <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Breakdown Score Kesehatan Truck</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-[#F5F5F7]">
                  <span className="text-[10px] text-[#6E6E73] font-medium">Tire Health</span>
                  <p className="text-base font-semibold text-[#1D1D1F] mt-0.5">{healthScore.breakdown.tireHealth}%</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F7]">
                  <span className="text-[10px] text-[#6E6E73] font-medium">Maintenance</span>
                  <p className="text-base font-semibold text-[#1D1D1F] mt-0.5">{healthScore.breakdown.maintenanceStatus}%</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F7]">
                  <span className="text-[10px] text-[#6E6E73] font-medium">Fuel Efficiency</span>
                  <p className="text-base font-semibold text-[#1D1D1F] mt-0.5">{healthScore.breakdown.fuelEfficiency}%</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F7]">
                  <span className="text-[10px] text-[#6E6E73] font-medium">Documents</span>
                  <p className="text-base font-semibold text-[#1D1D1F] mt-0.5">{healthScore.breakdown.documentValidity}%</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F7]">
                  <span className="text-[10px] text-[#6E6E73] font-medium">Odometer</span>
                  <p className="text-base font-semibold text-[#1D1D1F] mt-0.5">{healthScore.breakdown.odometerConsistency}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Interactive Chassis preview */}
          <MitsubishiChassisViewer
            truckId={truck.id}
            wheelPositions={formattedPositions}
            onInstallClick={(posId, posCode) => setInstallingPos({ id: posId, code: posCode })}
            onRemoveClick={(tireId) => handleRemoveTire(tireId)}
          />
        </div>
      )}

      {/* Tab 2: Interactive Chassis */}
      {activeTab === 'Chassis' && (
        <MitsubishiChassisViewer
          truckId={truck.id}
          wheelPositions={formattedPositions}
          onInstallClick={(posId, posCode) => setInstallingPos({ id: posId, code: posCode })}
          onRemoveClick={(tireId) => handleRemoveTire(tireId)}
        />
      )}

      {/* Tab 3: Ban */}
      {activeTab === 'Ban' && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#1D1D1F] text-sm">Daftar Ban Terpasang saat ini</h3>
            <Link href="/tires" className="text-xs font-semibold text-[#007AFF] hover:underline">
              Kelola Inventaris Ban &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {formattedPositions.map((pos: any) => (
              <div key={pos.id} className="p-3.5 rounded-xl bg-[#FAFAFA] border border-black/[0.06] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF] font-mono">
                      {pos.positionCode}
                    </span>
                    <span className="text-[11px] font-semibold text-[#6E6E73]">{pos.positionName}</span>
                  </div>
                  {pos.currentTire ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-xs text-[#1D1D1F]">
                        {pos.currentTire.tireCode} ({pos.currentTire.brand} {pos.currentTire.model})
                      </p>
                      <p className="text-[11px] text-[#6E6E73]">
                        Pemakaian: {formatKm(pos.currentTire.currentKm)} / {formatKm(pos.currentTire.expectedLifetimeKm)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#8E8E93] italic">Empty Position</p>
                  )}
                </div>

                <div className="pt-3 mt-2 border-t border-black/[0.06] flex items-center justify-end gap-2">
                  {pos.currentTire ? (
                    <button
                      onClick={() => handleRemoveTire(pos.currentTire.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#FF3B30] hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      Lepas Ban
                    </button>
                  ) : (
                    <button
                      onClick={() => setInstallingPos({ id: pos.id, code: pos.positionCode })}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Pasang Ban
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tire Installation Modal */}
      {installingPos && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-black/[0.08] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Disc className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Pasang Ban ke Posisi {installingPos.code} ({truck.policeNumber})
                </h3>
              </div>
              <button onClick={() => setInstallingPos(null)} className="p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {installError && (
              <div className="p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-xs border border-[#FF3B30]/20 font-semibold">
                {installError}
              </div>
            )}

            {availableUnmountedTires.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6E6E73] space-y-3">
                <p>Tidak ada ban di gudang (unmounted / baru) yang tersedia untuk dipasang.</p>
                <Link
                  href="/tires"
                  className="inline-block px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-colors"
                >
                  Daftarkan Ban Baru di Menu Ban &rarr;
                </Link>
              </div>
            ) : (
              <form onSubmit={handleConfirmInstall} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Pilih Ban dari Gudang *
                  </label>
                  <select
                    value={selectedTireId}
                    onChange={(e) => setSelectedTireId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-medium"
                    required
                  >
                    <option value="">-- Pilih Ban Gudang --</option>
                    {availableUnmountedTires.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tireCode} - {t.brand} {t.model} ({t.size}) - SN: {t.serialNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Odometer Pemasangan (KM) *
                  </label>
                  <input
                    type="number"
                    value={installedKm}
                    onChange={(e) => setInstalledKm(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none font-mono font-medium"
                    required
                  />
                  <p className="text-[10px] text-[#6E6E73] mt-1">
                    Default sesuai Odometer truck ({formatKm(truck.totalKm)})
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setInstallingPos(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#6E6E73] hover:bg-[#F5F5F7] rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={installLoading || !selectedTireId}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-colors disabled:opacity-50"
                  >
                    {installLoading ? 'Memproses...' : 'Konfirmasi Pemasangan Ban'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Pengiriman / Kontrak Perjalanan */}
      {activeTab === 'Pengiriman' && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4 text-[#1D1D1F]">
          <h3 className="font-semibold text-[#1D1D1F] text-sm">Riwayat Kontrak Perjalanan ERP &amp; Pengiriman Truck Ini</h3>
          {(!truck.tripContracts || truck.tripContracts.length === 0) && (!truck.shipments || truck.shipments.length === 0) ? (
            <p className="text-xs text-[#8E8E93] italic">Belum ada riwayat kontrak perjalanan atau pengiriman untuk truck ini.</p>
          ) : (
            <div className="space-y-4">
              {/* Trip Contracts List */}
              {truck.tripContracts && truck.tripContracts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[11px] text-[#6E6E73] font-semibold uppercase">
                        <th className="py-2.5 px-3">Kontrak</th>
                        <th className="py-2.5 px-3">Pelanggan</th>
                        <th className="py-2.5 px-3">Supir</th>
                        <th className="py-2.5 px-3">ERP 1 Berangkat</th>
                        <th className="py-2.5 px-3">ERP 2 Pulang</th>
                        <th className="py-2.5 px-3 text-right">Total Revenue</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06] font-medium">
                      {truck.tripContracts.map((c: any) => {
                        const outLeg = c.legs?.find((l: any) => l.legNumber === 1) || c.legs?.[0]
                        const retLeg = c.legs?.find((l: any) => l.legNumber === 2) || c.legs?.[1]

                        return (
                          <tr key={c.id} className="hover:bg-[#F5F5F7] transition-colors">
                            <td className="py-2.5 px-3 font-mono font-semibold text-[#007AFF]">
                              <Link href={`/contracts/${c.id}`} className="hover:underline">
                                {c.contractNumber}
                              </Link>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#1D1D1F]">{c.customer?.name}</td>
                            <td className="py-2.5 px-3 text-[#1D1D1F]">{c.driverName}</td>
                            <td className="py-2.5 px-3 text-[#6E6E73]">
                              {outLeg ? `${outLeg.origin} → ${outLeg.destination} (${outLeg.cargoType})` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-[#6E6E73]">
                              {retLeg ? `${retLeg.origin} → ${retLeg.destination} (${retLeg.cargoType})` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#248A3D]">
                              {formatCurrency(c.totalRevenue ? Number(c.totalRevenue) : null)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF] uppercase border border-[#007AFF]/20">
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Legacy Shipments List if any */}
              {truck.shipments && truck.shipments.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-[#6E6E73] mb-2">Riwayat Pengiriman Tunggal</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[11px] text-[#6E6E73] font-semibold uppercase">
                          <th className="py-2.5 px-3">Surat Jalan</th>
                          <th className="py-2.5 px-3">Pelanggan</th>
                          <th className="py-2.5 px-3">Rute</th>
                          <th className="py-2.5 px-3 text-right">Jarak</th>
                          <th className="py-2.5 px-3 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.06] font-medium">
                        {truck.shipments.map((s: any) => (
                          <tr key={s.id} className="hover:bg-[#F5F5F7] transition-colors">
                            <td className="py-2.5 px-3 font-mono font-semibold text-[#1D1D1F]">{s.shipmentNumber}</td>
                            <td className="py-2.5 px-3 text-[#1D1D1F]">{s.customer?.name}</td>
                            <td className="py-2.5 px-3 text-[#6E6E73]">{s.origin} &rarr; {s.destination}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#1D1D1F]">{formatKm(s.totalKm)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#248A3D]">
                              {formatCurrency(s.revenue ? Number(s.revenue) : null)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: BBM */}
      {activeTab === 'BBM' && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4 text-[#1D1D1F]">
          <h3 className="font-semibold text-[#1D1D1F] text-sm">Riwayat Refuel Bahan Bakar (Double Tank)</h3>
          {truck.fuelLogs.length === 0 ? (
            <p className="text-xs text-[#8E8E93] italic">Belum ada riwayat refuel BBM untuk truck ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[11px] text-[#6E6E73] font-semibold uppercase">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Tank 1</th>
                    <th className="py-2.5 px-3">Tank 2</th>
                    <th className="py-2.5 px-3 text-right">Total Liter</th>
                    <th className="py-2.5 px-3 text-right">KM Refuel</th>
                    <th className="py-2.5 px-3 text-right">Total Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {truck.fuelLogs.map((f: any) => (
                    <tr key={f.id} className="hover:bg-[#F5F5F7] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6E6E73]">{new Date(f.date).toLocaleDateString('id-ID')}</td>
                      <td className="py-2.5 px-3 text-[#1D1D1F]">{f.tank1Liters ? `${f.tank1Liters} L` : '-'}</td>
                      <td className="py-2.5 px-3 text-[#1D1D1F]">{f.tank2Liters ? `${f.tank2Liters} L` : '-'}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#1D1D1F]">{f.liter} L</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#1D1D1F]">{formatKm(f.kmAtRefuel)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#FF3B30]">
                        {formatCurrency(f.totalCost ? Number(f.totalCost) : null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Maintenance */}
      {activeTab === 'Maintenance' && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4 text-[#1D1D1F]">
          <h3 className="font-semibold text-[#1D1D1F] text-sm">Riwayat Service &amp; Perbaikan</h3>
          {truck.maintenances.length === 0 ? (
            <p className="text-xs text-[#8E8E93] italic">Belum ada catatan maintenance untuk truck ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[11px] text-[#6E6E73] font-semibold uppercase">
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Layanan</th>
                    <th className="py-2.5 px-3">Bengkel</th>
                    <th className="py-2.5 px-3 text-right">Odometer</th>
                    <th className="py-2.5 px-3 text-right">Biaya Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {truck.maintenances.map((m: any) => (
                    <tr key={m.id} className="hover:bg-[#F5F5F7] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6E6E73]">{new Date(m.date).toLocaleDateString('id-ID')}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#1D1D1F]">{m.description}</td>
                      <td className="py-2.5 px-3 text-[#6E6E73]">{m.workshop || 'Internal Workshop'}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#1D1D1F]">{formatKm(m.kmAtMaintenance)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#FF3B30]">
                        {formatCurrency(m.totalCost ? Number(m.totalCost) : null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Sparepart */}
      {activeTab === 'Sparepart' && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4 text-[#1D1D1F]">
          <h3 className="font-semibold text-[#1D1D1F] text-sm">Sparepart Terpasang / Digunakan</h3>
          {truck.sparepartUsages.length === 0 ? (
            <p className="text-xs text-[#8E8E93] italic">Belum ada penggunaan sparepart untuk truck ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[11px] text-[#6E6E73] font-semibold uppercase">
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Sparepart</th>
                    <th className="py-2.5 px-3 text-right">Jumlah</th>
                    <th className="py-2.5 px-3 text-right">Biaya Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-medium">
                  {truck.sparepartUsages.map((u: any) => (
                    <tr key={u.id} className="hover:bg-[#F5F5F7] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6E6E73]">{new Date(u.date).toLocaleDateString('id-ID')}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#1D1D1F]">{u.sparepart?.name} ({u.sparepart?.partNumber})</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#1D1D1F]">{u.quantity} {u.sparepart?.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#FF3B30]">
                        {formatCurrency(u.totalCost ? Number(u.totalCost) : null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 8: Keuangan */}
      {activeTab === 'Keuangan' && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4 text-[#1D1D1F]">
          <h3 className="font-semibold text-[#1D1D1F] text-sm">Ringkasan P&amp;L Keuangan Truck</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60">
              <span className="text-xs font-semibold text-[#248A3D]">Total Pendapatan (Revenue)</span>
              <p className="text-xl font-bold text-[#248A3D] mt-1 font-mono">
                {formatCurrency(totalRevenue > 0 ? totalRevenue : null)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/60">
              <span className="text-xs font-semibold text-[#FF3B30]">Total Biaya Operasional &amp; Mnt</span>
              <p className="text-xl font-bold text-[#FF3B30] mt-1 font-mono">
                {formatCurrency((totalOperatingCost + totalMaintenanceCost + totalFuelCost) > 0 ? (totalOperatingCost + totalMaintenanceCost + totalFuelCost) : null)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/60">
              <span className="text-xs font-semibold text-[#007AFF]">Net Profit Truck</span>
              <p className="text-xl font-bold text-[#007AFF] mt-1 font-mono">
                {formatCurrency((totalRevenue - totalOperatingCost - totalMaintenanceCost - totalFuelCost) !== 0 ? (totalRevenue - totalOperatingCost - totalMaintenanceCost - totalFuelCost) : null)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Activity */}
      {activeTab === 'Activity' && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4 text-[#1D1D1F]">
          <h3 className="font-semibold text-[#1D1D1F] text-sm">Chronological Digital Logbook Activity Stream</h3>
          {digitalLogbook.length === 0 ? (
            <p className="text-xs text-[#8E8E93] italic">Belum ada aktivitas terekam untuk truck ini.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-black/[0.08]">
              {digitalLogbook.map((event) => (
                <div key={event.id} className="relative flex items-start justify-between gap-4">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#007AFF] ring-4 ring-white" />
                  <div>
                    <span className="text-[10px] font-mono text-[#6E6E73]">
                      {new Date(event.date).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <h4 className="font-semibold text-xs text-[#1D1D1F] mt-0.5">{event.title}</h4>
                    <p className="text-xs text-[#6E6E73] mt-0.5 leading-relaxed">{event.description}</p>
                  </div>
                  {event.link && (
                    <Link href={event.link} className="text-xs text-[#007AFF] hover:underline shrink-0 font-semibold">
                      Detail &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!removeTireTargetId}
        onClose={() => setRemoveTireTargetId(null)}
        onConfirm={handleConfirmRemoveTire}
        title="Lepaskan Ban dari Chassis"
        description="Apakah Anda yakin ingin melepaskan ban ini dari posisi roda truck? Riwayat pemakaian KM ban akan tetap tersimpan."
        confirmText="Ya, Lepaskan Ban"
        cancelText="Batal"
        variant="warning"
        loading={removeLoading}
      />
    </div>
  )
}
