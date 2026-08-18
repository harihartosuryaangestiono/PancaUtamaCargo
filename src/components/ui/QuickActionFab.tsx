'use client'

import React, { useState } from 'react'
import { Plus, Truck, Disc, Package, Users, Fuel, Wrench, PackagePlus, DollarSign, TrendingDown } from 'lucide-react'
import Link from 'next/link'

interface QuickActionFabProps {
  userRole?: 'OWNER' | 'FINANCE'
}

export function QuickActionFab({ userRole = 'OWNER' }: QuickActionFabProps) {
  const [isOpen, setIsOpen] = useState(false)

  const isOwner = userRole === 'OWNER'

  const actions = [
    { label: 'Tambah Truck', href: '/trucks', icon: Truck, roleReq: 'OWNER' },
    { label: 'Tambah Ban', href: '/tires', icon: Disc, roleReq: 'OWNER' },
    { label: 'Buat Kontrak Perjalanan', href: '/contracts', icon: Package, roleReq: 'OWNER' },
    { label: 'Tambah Pelanggan', href: '/customers', icon: Users, roleReq: 'ALL' },
    { label: 'Catat Refuel BBM', href: '/fuel', icon: Fuel, roleReq: 'ALL' },
    { label: 'Tambah Maintenance', href: '/maintenance', icon: Wrench, roleReq: 'OWNER' },
    { label: 'Tambah Sparepart', href: '/spareparts', icon: PackagePlus, roleReq: 'OWNER' },
    { label: 'Catat Pemasukan', href: '/financials', icon: DollarSign, roleReq: 'ALL' },
    { label: 'Catat Pengeluaran', href: '/financials', icon: TrendingDown, roleReq: 'ALL' },
  ]

  const availableActions = actions.filter((a) => a.roleReq === 'ALL' || isOwner)

  return (
    <div className="fixed bottom-20 right-6 sm:bottom-8 sm:right-8 z-40">
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-16 right-0 w-64 bg-white border border-black/[0.08] rounded-2xl shadow-2xl p-3 z-50 space-y-1 text-xs text-[#1D1D1F]">
            <div className="px-3 py-1.5 font-bold text-[#6E6E73] uppercase tracking-wider text-[10px]">
              Aksi Cepat Sistem
            </div>
            {availableActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <Link
                  key={idx}
                  href={action.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#1D1D1F] hover:bg-[#F5F5F7] hover:text-[#007AFF] font-medium transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-center text-[#007AFF]">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{action.label}</span>
                </Link>
              )
            })}
          </div>
        </>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-13 h-13 rounded-2xl bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none z-50 ${
          isOpen ? 'rotate-45 bg-[#1D1D1F]' : ''
        }`}
        title="Aksi Cepat"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
