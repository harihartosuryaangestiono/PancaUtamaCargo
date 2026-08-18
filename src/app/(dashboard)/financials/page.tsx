import { requireAuth } from '@/lib/session'
import { getFinancialsAction, getPnLReportAction } from '@/app/actions/financialActions'
import { getIncomeCategoriesAction, getExpenseCategoriesAction, getCustomersAction } from '@/app/actions/masterDataActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { DollarSign } from 'lucide-react'
import { CreateTransactionModal } from './CreateTransactionModal'

export default async function FinancialsPage() {
  const session = await requireAuth()
  const transactions = await getFinancialsAction()
  const pnl = await getPnLReportAction()
  const incomeCategories = await getIncomeCategoriesAction()
  const expenseCategories = await getExpenseCategoriesAction()
  const customers = await getCustomersAction()

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <h2 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
            Pembukuan &amp; Transaksi Keuangan
          </h2>
          <p className="text-xs text-[#6E6E73] font-medium mt-1">
            Jurnal pemasukan, pengeluaran, dan ringkasan laba rugi (P&amp;L).
          </p>
        </div>

        <CreateTransactionModal
          incomeCategories={incomeCategories.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
          expenseCategories={expenseCategories.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
          customers={customers.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
        />
      </div>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-1 hover:-translate-y-[1px] transition-all">
          <span className="text-xs font-medium text-[#6E6E73]">Total Pemasukan (Income)</span>
          <p className="text-2xl font-semibold text-[#34C759] tracking-tight mt-1">
            {formatCurrency(pnl.totalIncome > 0 ? pnl.totalIncome : null)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-1 hover:-translate-y-[1px] transition-all">
          <span className="text-xs font-medium text-[#6E6E73]">Total Pengeluaran (Expense)</span>
          <p className="text-2xl font-semibold text-[#FF3B30] tracking-tight mt-1">
            {formatCurrency(pnl.totalExpense > 0 ? pnl.totalExpense : null)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-1 hover:-translate-y-[1px] transition-all">
          <span className="text-xs font-medium text-[#6E6E73]">Net Profit (Laba Bersih)</span>
          <p className="text-2xl font-semibold text-[#1D1D1F] tracking-tight mt-1">
            {formatCurrency(pnl.transactionCount > 0 ? pnl.netProfit : null)}
          </p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Belum Ada Transaksi Keuangan"
          description="Database pembukuan keuangan saat ini masih kosong. Silakan catat transaksi pemasukan atau pengeluaran pertama Anda."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFAFA] text-[#6E6E73] uppercase tracking-wider font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">No. Transaksi / Tanggal</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Deskripsi</th>
                  <th className="py-3.5 px-4 text-right">Nominal Rp</th>
                  <th className="py-3.5 px-4">Metode Bayar</th>
                  <th className="py-3.5 px-4">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#1D1D1F] block">
                        {t.transactionNumber}
                      </span>
                      <span className="text-[10px] text-[#6E6E73]">{formatDate(t.date)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {t.type === 'INCOME' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20">
                          + INCOME
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                          - EXPENSE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">
                      {t.type === 'INCOME' ? t.incomeCategory?.name : t.expenseCategory?.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      {t.description}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-mono font-bold ${t.type === 'INCOME' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                      {formatCurrency(Number(t.amount))}
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      {t.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      {t.createdBy.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
