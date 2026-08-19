import { requireAuth } from '@/lib/session'
import { getContractByIdAction } from '@/app/actions/contractActions'
import { notFound } from 'next/navigation'
import { PrintableInvoiceClient } from './PrintableInvoiceClient'

interface InvoicePageProps {
  params: Promise<{ id: string }>
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  await requireAuth()
  const { id } = await params
  const contract = await getContractByIdAction(id)

  if (!contract) {
    notFound()
  }

  return <PrintableInvoiceClient contract={contract} />
}
