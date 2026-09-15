import { requireAuth } from '@/lib/session'
import { getPiutangContractsAction } from '@/app/actions/piutangActions'
import { getCustomersAction } from '@/app/actions/masterDataActions'
import { PiutangClientTable } from './PiutangClientTable'
import { Receipt } from 'lucide-react'

export default async function PiutangPage() {
  await requireAuth()

  const { contracts, summary } = await getPiutangContractsAction()
  const customers = await getCustomersAction()

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#007AFF]" />
            <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
              Piutang Pelanggan (Accounts Receivable)
            </h2>
          </div>
          <p className="text-xs text-[#6E6E73] font-medium mt-1">
            Pemantauan status pembayaran tagihan angkutan dan pencatatan pelunasan uang masuk dari customer.
          </p>
        </div>
      </div>

      <PiutangClientTable
        initialContracts={contracts}
        summary={summary}
        customers={customers.map((c: any) => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
