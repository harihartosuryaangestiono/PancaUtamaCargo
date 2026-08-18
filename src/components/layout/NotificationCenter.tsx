'use client'

import React, { useState } from 'react'
import { Bell, Package, Disc, Truck, X, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface NotificationItem {
  id: string
  type: 'TIRE' | 'SPAREPART' | 'TRUCK'
  title: string
  description: string
  severity: 'WARNING' | 'CRITICAL' | 'DUE'
  href: string
}

interface NotificationCenterProps {
  alerts: NotificationItem[]
}

export function NotificationCenter({ alerts }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const count = alerts.length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        title="Pusat Notifikasi & Operational Alerts"
        className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors relative"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF3B30] text-white font-bold text-[9px] flex items-center justify-center shadow-2xs animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-black/[0.08] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#1D1D1F]">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#007AFF]" />
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Operational Alert Center</h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-[#8E8E93] hover:text-[#1D1D1F] rounded-lg hover:bg-[#F5F5F7]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6E6E73]">
              <CheckCircle className="w-8 h-8 text-[#34C759] mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-[#1D1D1F]">Semua Perangkat Operasional Normal</p>
              <p className="text-[11px] text-[#6E6E73] mt-0.5">Tidak ada peringatan ban haus, stok menipis, atau truck maintenance saat ini.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  onClick={() => setOpen(false)}
                  className={`block p-3 rounded-xl border transition-all text-xs hover:scale-[1.01] ${
                    alert.severity === 'DUE'
                      ? 'bg-rose-50 border-rose-200 text-[#FF3B30]'
                      : alert.severity === 'CRITICAL'
                      ? 'bg-amber-50 border-amber-200 text-[#FF9500]'
                      : 'bg-amber-50 border-amber-200 text-[#C67300]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {alert.type === 'TIRE' && <Disc className="w-4 h-4 shrink-0 mt-0.5 text-[#007AFF]" />}
                    {alert.type === 'SPAREPART' && <Package className="w-4 h-4 shrink-0 mt-0.5 text-[#007AFF]" />}
                    {alert.type === 'TRUCK' && <Truck className="w-4 h-4 shrink-0 mt-0.5 text-[#007AFF]" />}
                    <div>
                      <p className="font-semibold tracking-tight">{alert.title}</p>
                      <p className="text-[11px] opacity-80 mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
