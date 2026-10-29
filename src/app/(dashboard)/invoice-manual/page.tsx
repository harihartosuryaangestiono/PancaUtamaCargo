import { requireAuth } from '@/lib/session'
import { ManualInvoiceClient } from './ManualInvoiceClient'

export default async function ManualInvoicePage() {
  await requireAuth()

  return <ManualInvoiceClient />
}
