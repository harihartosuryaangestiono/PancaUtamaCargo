import { requireAuth } from '@/lib/session'
import { getExecutiveDashboard } from '@/lib/reports/executiveReportService'
import { ExecutiveDashboardClient } from '@/app/(dashboard)/reports/executive/ExecutiveDashboardClient'

export default async function BusinessReportPage() {
  const session = await requireAuth()
  const initialData = await getExecutiveDashboard('THIS_MONTH')

  return (
    <ExecutiveDashboardClient
      initialData={initialData}
      initialPeriod="THIS_MONTH"
      userRole={session.role}
    />
  )
}
