'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  Disc,
  Wrench,
  DollarSign,
  Package,
  FileText,
  Database,
  Settings,
  Shield,
  Users,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { logoutAction } from '@/app/actions/authActions'

type RoleType = 'OWNER' | 'FINANCE'

interface SidebarProps {
  userRole: RoleType
  userName: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()

  const navGroups = [
    {
      title: 'OPERASIONAL',
      items: [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Truck Tronton',
          href: '/trucks',
          icon: Truck,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Kontrak Perjalanan',
          href: '/contracts',
          icon: FileText,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Pengemudi Armada',
          href: '/drivers',
          icon: Users,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Manajemen Ban',
          href: '/tires',
          icon: Disc,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Pelanggan',
          href: '/customers',
          icon: Users,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Maintenance',
          href: '/maintenance',
          icon: Wrench,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Dokumen Fleet',
          href: '/documents',
          icon: FileText,
          roles: ['OWNER', 'FINANCE'],
        },
      ],
    },
    {
      title: 'KEUANGAN & INTELIJEN',
      items: [
        {
          label: 'Pembukuan Keuangan',
          href: '/financials',
          icon: DollarSign,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Stok & Sparepart',
          href: '/spareparts',
          icon: Package,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Leaderboard Supir',
          href: '/reports/drivers',
          icon: FileText,
          roles: ['OWNER', 'FINANCE'],
        },
      ],
    },
    {
      title: 'SISTEM & SETTINGS',
      items: [
        {
          label: 'Master Data',
          href: '/master-data',
          icon: Database,
          roles: ['OWNER', 'FINANCE'],
        },
        {
          label: 'Pengaturan Sistem',
          href: '/settings',
          icon: Settings,
          roles: ['OWNER'],
        },
        {
          label: 'Audit Log',
          href: '/audit',
          icon: Shield,
          roles: ['OWNER'],
        },
      ],
    },
  ]

  return (
    <aside className="w-64 bg-white text-[#1D1D1F] flex flex-col h-screen sticky top-0 border-r border-black/[0.08] shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-3 border-b border-black/[0.06]">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-black/[0.08] bg-white shrink-0 shadow-2xs">
          <img
            src="/LogoPancaUtamaCargoCircular.png"
            alt="Logo Panca Utama Cargo"
            className="w-full h-full object-contain p-0.5 rounded-full"
          />
        </div>
        <div>
          <h1 className="font-bold text-[#1D1D1F] text-xs tracking-tight leading-snug">Panca Utama Cargo</h1>
          <p className="text-[10px] text-[#34C759] font-semibold tracking-wide">Aman · Tepat · Terpercaya</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(userRole))
          if (visibleItems.length === 0) return null

          return (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[10px] font-bold text-[#8E8E93] tracking-wider uppercase">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' &&
                      item.href !== '/reports' &&
                      pathname.startsWith(item.href + '/'))
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#F2F2F7] text-[#1D1D1F] font-semibold border border-black/[0.04]'
                          : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Active User Footer */}
      <div className="p-3 border-t border-black/[0.06] bg-[#FAFAFA]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/[0.06] shadow-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 text-[#007AFF] font-bold text-xs flex items-center justify-center shrink-0 border border-[#007AFF]/20">
              {userName.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-[#1D1D1F] truncate">{userName}</p>
              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                userRole === 'OWNER'
                  ? 'bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20'
                  : 'bg-[#FF9500]/10 text-[#C67300] border border-[#FF9500]/20'
              }`}>
                {userRole}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
            title="Logout"
            className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
