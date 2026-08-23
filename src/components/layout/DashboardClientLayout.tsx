'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { QuickActionFab } from '@/components/ui/QuickActionFab'
import { MobileBottomNav } from '@/components/ui/MobileBottomNav'

interface DashboardClientLayoutProps {
  userRole: 'OWNER' | 'FINANCE' | 'VIEWER'
  userName: string
  children: React.ReactNode
}

export function DashboardClientLayout({ userRole, userName, children }: DashboardClientLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] text-[#1D1D1F] pb-20 lg:pb-0">
      <Sidebar
        userRole={userRole}
        userName={userName}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          title="Panca Utama Cargo"
          subtitle="Sistem Operasional Tronton & Pembukuan Keuangan — Aman · Tepat · Terpercaya"
          userRole={userRole}
          userName={userName}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      <QuickActionFab userRole={userRole} />
      <MobileBottomNav onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
    </div>
  )
}
