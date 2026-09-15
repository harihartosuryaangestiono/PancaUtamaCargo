import { requireAuth } from '@/lib/session'
import { getBcaMutationsAction } from '@/app/actions/bcaMutationActions'
import { getIncomeCategoriesAction, getExpenseCategoriesAction, getCustomersAction } from '@/app/actions/masterDataActions'
import { getPiutangContractsAction } from '@/app/actions/piutangActions'
import { getTrucksAction } from '@/app/actions/truckActions'
import { BcaMutationView } from './BcaMutationView'

export default async function BcaMutationsPage() {
  await requireAuth()
  const [data, incomeCategories, expenseCategories, customers, piutangRes, trucks] = await Promise.all([
    getBcaMutationsAction(),
    getIncomeCategoriesAction(),
    getExpenseCategoriesAction(),
    getCustomersAction(),
    getPiutangContractsAction(),
    getTrucksAction(),
  ])

  return (
    <BcaMutationView
      initialMutations={data.mutations}
      initialSummary={data.summary}
      incomeCategories={incomeCategories.map((c: any) => ({ id: c.id, name: c.name }))}
      expenseCategories={expenseCategories.map((c: any) => ({ id: c.id, name: c.name }))}
      customers={customers.map((c: any) => ({ id: c.id, name: c.name }))}
      contracts={piutangRes.contracts.map((c: any) => ({
        id: c.id,
        contractNumber: c.contractNumber,
        customerId: c.customerId,
        remainingPiutang: c.remainingPiutang,
        customer: c.customer ? { name: c.customer.name } : undefined,
      }))}
      trucks={trucks.map((t: any) => ({ id: t.id, policeNumber: t.policeNumber, brand: t.brand, model: t.model }))}
    />
  )
}

