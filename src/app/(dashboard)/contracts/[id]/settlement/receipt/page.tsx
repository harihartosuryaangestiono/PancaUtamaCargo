import { requireAuth } from '@/lib/session'
import { getContractByIdAction } from '@/app/actions/contractActions'
import { notFound } from 'next/navigation'
import { PrintableReceiptClient } from './PrintableReceiptClient'

interface SettlementReceiptPageProps {
  params: Promise<{ id: string }>
}

export default async function SettlementReceiptPage({ params }: SettlementReceiptPageProps) {
  await requireAuth()
  const { id } = await params

  const contract = await getContractByIdAction(id)
  if (!contract) {
    notFound()
  }

  return <PrintableReceiptClient contract={contract} />
}
