import { requireAuth } from '@/lib/session'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { QuickActionFab } from '@/components/ui/QuickActionFab'
import { MobileBottomNav } from '@/components/ui/MobileBottomNav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] text-[#1D1D1F] pb-16 sm:pb-0">
      <Sidebar userRole={session.role} userName={session.name} />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          title="Panca Utama Cargo"
          subtitle="Sistem Operasional Tronton & Pembukuan Keuangan — Aman · Tepat · Terpercaya"
          userRole={session.role}
          userName={session.name}
        />

        <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      <QuickActionFab userRole={session.role} />
      <MobileBottomNav />
    </div>
  )
}
