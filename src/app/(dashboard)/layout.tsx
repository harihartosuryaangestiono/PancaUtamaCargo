import { requireAuth } from '@/lib/session'
import { DashboardClientLayout } from '@/components/layout/DashboardClientLayout'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <DashboardClientLayout userRole={session.role} userName={session.name}>
      {children}
    </DashboardClientLayout>
  )
}
