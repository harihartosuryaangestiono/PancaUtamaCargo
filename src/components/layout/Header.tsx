'use client'

import React, { useState } from 'react'
import { Shield, LogOut, Lock, Sparkles } from 'lucide-react'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { logoutAction } from '@/app/actions/authActions'
import Link from 'next/link'

interface HeaderProps {
  title: string
  subtitle?: string
  userRole: 'OWNER' | 'FINANCE'
  userName: string
  alerts?: Array<{
    id: string
    type: 'TIRE' | 'SPAREPART' | 'TRUCK'
    title: string
    description: string
    severity: 'WARNING' | 'CRITICAL' | 'DUE'
    href: string
  }>
}

export function Header({ title, subtitle, userRole, userName, alerts = [] }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const initial = userName ? userName.charAt(0).toUpperCase() : 'U'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-3.5 bg-white border-b border-black/[0.08]">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[#6E6E73] mt-0.5 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Command Palette Search */}
        <CommandPalette />

        {/* Smart Notification Center */}
        <NotificationBell />

        {/* User Profile Avatar Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 pl-2.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-full border border-black/[0.06] transition-all active:scale-95"
          >
            <span className="text-xs font-semibold text-[#1D1D1F] hidden md:inline">
              {userName}
            </span>
            <div className="w-7 h-7 rounded-full bg-[#007AFF] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
              {initial}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-black/[0.08] shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-black/[0.06]">
                <p className="font-bold text-[#1D1D1F]">{userName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield className="w-3 h-3 text-[#007AFF]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    Role: {userRole}
                  </span>
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors font-medium"
                >
                  <Lock className="w-3.5 h-3.5 text-[#8E8E93]" />
                  <span>Ubah Password</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8E8E93]" />
                  <span>Pengaturan Sistem</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-black/[0.06]">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#FF3B30] hover:bg-rose-50 transition-colors font-semibold text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout Keluar</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
