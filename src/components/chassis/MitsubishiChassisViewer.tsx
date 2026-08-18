'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Disc, AlertTriangle, Plus, X } from 'lucide-react'
import { formatKm, formatPercent } from '@/lib/utils/format'

interface WheelPositionData {
  id: string
  positionCode: string
  positionName: string
  axleNumber: number
  side: string
  isInner: boolean
  currentTire?: {
    id: string
    tireCode: string
    brand: string
    model: string
    size: string
    serialNumber: string
    currentKm: number
    expectedLifetimeKm: number
    remainingLifetimeKm: number
    status: string
    condition: string | null
    purchasePrice: number | null
  } | null
}

interface MitsubishiChassisViewerProps {
  truckId: string
  wheelPositions: WheelPositionData[]
  onInstallClick?: (positionId: string, positionCode: string) => void
  onRemoveClick?: (tireId: string) => void
}

export function MitsubishiChassisViewer({
  wheelPositions,
  onInstallClick,
  onRemoveClick,
}: MitsubishiChassisViewerProps) {
  const [selectedPos, setSelectedPos] = useState<WheelPositionData | null>(null)

  // Map wheel positions array by positionCode for fast lookup
  const posMap = new Map<string, WheelPositionData>()
  wheelPositions.forEach((pos) => posMap.set(pos.positionCode, pos))

  // Coordinates for the 10 hotspot overlays relative to top-view schematic
  // Front Steering: FL, FR
  // Axle 2: R1-LI, R1-LO, R1-RI, R1-RO
  // Axle 3: R2-LI, R2-LO, R2-RI, R2-RO
  const hotspots: Record<string, { top: string; left: string }> = {
    FL: { top: '34%', left: '26%' },
    FR: { top: '34%', left: '74%' },

    'R1-LO': { top: '65%', left: '18%' },
    'R1-LI': { top: '65%', left: '32%' },
    'R1-RI': { top: '65%', left: '68%' },
    'R1-RO': { top: '65%', left: '82%' },

    'R2-LO': { top: '78%', left: '18%' },
    'R2-LI': { top: '78%', left: '32%' },
    'R2-RI': { top: '78%', left: '68%' },
    'R2-RO': { top: '78%', left: '82%' },
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'NORMAL':
        return { label: 'Normal', color: 'bg-[#34C759] text-white shadow-2xs' }
      case 'WARNING':
        return { label: 'Warning', color: 'bg-[#FF9500] text-white shadow-2xs' }
      case 'CRITICAL':
        return { label: 'Critical', color: 'bg-[#FF3B30] text-white shadow-2xs' }
      case 'REPLACEMENT_DUE':
        return { label: 'Replacement Due', color: 'bg-[#FF3B30] text-white shadow-2xs' }
      default:
        return { label: 'Empty', color: 'bg-[#E5E5EA] text-[#6E6E73]' }
    }
  }

  return (
    <div className="relative w-full bg-white rounded-2xl p-6 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden text-[#1D1D1F]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-black/[0.06] pb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
            Interactive Chassis &amp; Wheel Mapping
          </h2>
          <p className="text-xs text-[#6E6E73]">
            Mitsubishi Fighter F61L HD R 6×2 · 10 Wheel Positions
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
            <span className="text-[#6E6E73]">Normal (&lt;70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
            <span className="text-[#6E6E73]">Warning (70-90%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" />
            <span className="text-[#6E6E73]">Due (&ge;90%)</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Diagram Canvas - White & Light Gray Workspace */}
      <div className="relative w-full max-w-3xl mx-auto aspect-[4/5] bg-[#F5F5F7] rounded-2xl border border-black/[0.06] p-4 flex items-center justify-center">
        {/* Chassis Top Schematic Background Asset */}
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src="/chassis-mitsubishi-6x2.png"
            alt="Mitsubishi Fighter 6x2 Chassis Schematic"
            fill
            className="object-contain opacity-75 select-none pointer-events-none filter contrast-125"
            priority
          />

          {/* Render 10 Hotspots over the schematic */}
          {Object.entries(hotspots).map(([posCode, coords]) => {
            const posData = posMap.get(posCode)
            const tire = posData?.currentTire
            const badge = getStatusBadge(tire?.status)
            const usedKm = tire?.currentKm ?? 0
            const expectedKm = tire?.expectedLifetimeKm ?? 60000
            const usagePercent = expectedKm > 0 ? (usedKm / expectedKm) * 100 : 0

            return (
              <button
                key={posCode}
                onClick={() => posData && setSelectedPos(posData)}
                style={{ top: coords.top, left: coords.left }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                {/* Hotspot Button Icon */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs border-2 border-white font-semibold text-xs ${badge.color}`}
                >
                  {tire ? (
                    <Disc className="w-5 h-5" />
                  ) : (
                    <Plus className="w-4 h-4 text-[#6E6E73]" />
                  )}
                </div>

                {/* Hotspot Label Pill */}
                <div className="mt-1 px-2 py-0.5 rounded-md bg-white text-[#1D1D1F] border border-black/[0.08] text-[10px] font-semibold tracking-wider shadow-2xs group-hover:bg-[#007AFF] group-hover:text-white transition-colors">
                  {posCode}
                </div>

                {/* Usage % or Empty tool-pill */}
                <div className="mt-0.5 text-[9px] font-medium text-[#6E6E73] bg-white px-1.5 py-0.2 rounded border border-black/[0.06] shadow-2xs">
                  {tire ? `${tire.brand} (${formatPercent(usagePercent)})` : 'Empty'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Wheel Position Modal / Drawer */}
      {selectedPos && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-black/[0.08] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div>
                <span className="px-2.5 py-1 rounded-lg bg-[#007AFF]/10 text-[#007AFF] font-bold text-xs tracking-wider">
                  {selectedPos.positionCode}
                </span>
                <h3 className="text-base font-semibold text-[#1D1D1F] mt-1">
                  {selectedPos.positionName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPos(null)}
                className="p-2 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tire Details or Empty State */}
            {selectedPos.currentTire ? (
              <div className="space-y-5">
                {/* Status Alert Pill */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAFAFA] border border-black/[0.06]">
                  <div className="flex items-center gap-3">
                    <Disc className="w-5 h-5 text-[#007AFF]" />
                    <div>
                      <h4 className="text-xs font-semibold text-[#1D1D1F]">
                        {selectedPos.currentTire.tireCode} · {selectedPos.currentTire.brand} {selectedPos.currentTire.model}
                      </h4>
                      <p className="text-[11px] text-[#6E6E73] font-mono">
                        SN: {selectedPos.currentTire.serialNumber} · Size: {selectedPos.currentTire.size}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${getStatusBadge(selectedPos.currentTire.status).color}`}>
                    {getStatusBadge(selectedPos.currentTire.status).label}
                  </span>
                </div>

                {/* Lifetime Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#6E6E73]">Usage Distance:</span>
                    <span className="font-semibold text-[#1D1D1F]">
                      {formatKm(selectedPos.currentTire.currentKm)} / {formatKm(selectedPos.currentTire.expectedLifetimeKm)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F5F5F7] rounded-full overflow-hidden p-0.5 border border-black/[0.06]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        selectedPos.currentTire.status === 'REPLACEMENT_DUE'
                          ? 'bg-[#FF3B30]'
                          : selectedPos.currentTire.status === 'CRITICAL'
                          ? 'bg-[#FF3B30]'
                          : selectedPos.currentTire.status === 'WARNING'
                          ? 'bg-[#FF9500]'
                          : 'bg-[#34C759]'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (selectedPos.currentTire.currentKm / selectedPos.currentTire.expectedLifetimeKm) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#6E6E73]">
                    <span>{formatPercent((selectedPos.currentTire.currentKm / selectedPos.currentTire.expectedLifetimeKm) * 100)} Used</span>
                    <span>Remaining: {formatKm(selectedPos.currentTire.remainingLifetimeKm)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  {onRemoveClick && (
                    <button
                      onClick={() => {
                        onRemoveClick(selectedPos.currentTire!.id)
                        setSelectedPos(null)
                      }}
                      className="flex-1 py-2.5 text-xs font-semibold text-[#FF3B30] bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
                    >
                      Dismount Tire from Position
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs font-medium text-[#6E6E73] mb-4">
                  Position {selectedPos.positionCode} is currently empty.
                </p>
                {onInstallClick && (
                  <button
                    onClick={() => {
                      onInstallClick(selectedPos.id, selectedPos.positionCode)
                      setSelectedPos(null)
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Install Tire from Warehouse
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
