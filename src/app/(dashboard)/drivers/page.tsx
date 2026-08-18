import { requireAuth } from '@/lib/session'
import { getDriversAction, checkDriverLicenseExpirationsAction } from '@/app/actions/driverActions'
import { DriverClientTable } from './DriverClientTable'

export default async function DriversPage() {
  const session = await requireAuth()

  // Run automated check for expiring driver licenses
  await checkDriverLicenseExpirationsAction()

  const drivers = await getDriversAction()

  return <DriverClientTable drivers={drivers} userRole={session.role} />
}
