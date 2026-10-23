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
    <div className="flex min-h-screen bg-[#F5F5F7] text-[#1D1D1F] pb-20 lg:pb-0 print:block print:min-h-0 print:bg-white print:pb-0">
      <div className="print:hidden">
        <Sidebar
          userRole={userRole}
          userName={userName}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden print:block print:overflow-visible">
        <div className="print:hidden">
          <Header
            title="Panca Utama Cargo"
            subtitle="Sistem Operasional Tronton & Pembukuan Keuangan — Aman · Tepat · Terpercaya"
            userRole={userRole}
            userName={userName}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        </div>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1440px] w-full mx-auto print:p-0 print:space-y-0 print:max-w-none print:w-full print:mx-0">
          {children}
        </main>
      </div>

      <div className="print:hidden">
        <QuickActionFab userRole={userRole} />
        <MobileBottomNav onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
      </div>
    </div>
  )
}
