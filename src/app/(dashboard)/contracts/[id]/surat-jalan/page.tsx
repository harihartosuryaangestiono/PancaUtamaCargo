import { requireAuth } from '@/lib/session'
import { getContractByIdAction } from '@/app/actions/contractActions'
import { notFound } from 'next/navigation'
import { PrintableSuratJalanClient } from './PrintableSuratJalanClient'

interface SuratJalanPageProps {
  params: Promise<{ id: string }>
}

export default async function SuratJalanPage({ params }: SuratJalanPageProps) {
  await requireAuth()
  const { id } = await params
  const contract = await getContractByIdAction(id)

  if (!contract) {
    notFound()
  }

  return <PrintableSuratJalanClient contract={contract} />
}
