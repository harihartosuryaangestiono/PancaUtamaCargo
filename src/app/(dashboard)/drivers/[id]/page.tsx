import { requireAuth } from '@/lib/session'
import { getDriverByIdAction } from '@/app/actions/driverActions'
import { notFound } from 'next/navigation'
import { DriverDetailClient } from './DriverDetailClient'

interface DriverDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
  await requireAuth()
  const { id } = await params

  const driver = await getDriverByIdAction(id)
  if (!driver) {
    notFound()
  }

  return <DriverDetailClient driver={driver} />
}
