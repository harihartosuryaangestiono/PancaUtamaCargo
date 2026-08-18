'use me'
import { requireAuth } from '@/lib/session'
import { getDriverLeaderboardAction } from '@/app/actions/driverActions'
import { DriverLeaderboardClient } from './DriverLeaderboardClient'

interface DriverReportsPageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function DriverReportsPage({ searchParams }: DriverReportsPageProps) {
  await requireAuth()
  const params = await searchParams
  const period = params.period || 'THIS_MONTH'

  const leaderboard = await getDriverLeaderboardAction(period)

  return <DriverLeaderboardClient leaderboard={leaderboard} currentPeriod={period} />
}
