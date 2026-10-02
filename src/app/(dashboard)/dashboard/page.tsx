import { requireAuth } from '@/lib/session'
import { getExecutiveDashboard, PeriodFilter } from '@/lib/reports/executiveReportService'
import { ExecutiveDashboardClient } from '@/app/(dashboard)/reports/executive/ExecutiveDashboardClient'

export default async function DashboardPage() {
  const session = await requireAuth()
  let initialPeriod: PeriodFilter = 'THIS_MONTH'
  let initialData = await getExecutiveDashboard('THIS_MONTH')

  // Smart fallback: Jika bulan berjalan belum memiliki transaksi (misal awal bulan baru),
  // cek apakah bulan sebelumnya memiliki data agar dashboard menampilkan overview terkini
  if (initialData.summary.totalContracts === 0) {
    const lastMonthData = await getExecutiveDashboard('LAST_MONTH')
    if (lastMonthData.summary.totalContracts > 0) {
      initialData = lastMonthData
      initialPeriod = 'LAST_MONTH'
    }
  }

  return (
    <ExecutiveDashboardClient
      initialData={initialData}
      initialPeriod={initialPeriod}
      userRole={session.role}
    />
  )
}
