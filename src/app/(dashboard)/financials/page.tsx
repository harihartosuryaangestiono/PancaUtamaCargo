import { requireAuth } from '@/lib/session'
import { getFinancialsAction, getPnLReportAction } from '@/app/actions/financialActions'
import { getIncomeCategoriesAction, getExpenseCategoriesAction, getCustomersAction } from '@/app/actions/masterDataActions'
import { FinancialsClientView } from './FinancialsClientView'

export default async function FinancialsPage() {
  const session = await requireAuth()
  const [transactions, pnl, incomeCategories, expenseCategories, customers] = await Promise.all([
    getFinancialsAction(),
    getPnLReportAction(),
    getIncomeCategoriesAction(),
    getExpenseCategoriesAction(),
    getCustomersAction(),
  ])

  return (
    <FinancialsClientView
      initialTransactions={transactions}
      pnl={pnl}
      incomeCategories={incomeCategories.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
      expenseCategories={expenseCategories.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
      customers={customers.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
      userRole={session.role}
    />
  )
}
