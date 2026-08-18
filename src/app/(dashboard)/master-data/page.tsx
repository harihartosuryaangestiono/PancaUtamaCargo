import { requireAuth } from '@/lib/session'
import { getCustomersAction, getSparepartCategoriesAction, getIncomeCategoriesAction, getExpenseCategoriesAction } from '@/app/actions/masterDataActions'
import { Users, Package, TrendingUp, TrendingDown } from 'lucide-react'

export default async function MasterDataPage() {
  await requireAuth()

  const customers = await getCustomersAction()
  const sparepartCategories = await getSparepartCategoriesAction()
  const incomeCategories = await getIncomeCategoriesAction()
  const expenseCategories = await getExpenseCategoriesAction()

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      <div>
        <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
          Master Data Management
        </h2>
        <p className="text-xs text-[#6E6E73] mt-0.5">
          Database acuan pelanggan (Customer), kategori sparepart, serta kategori transaksi pemasukan &amp; pengeluaran.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer List Card */}
        <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#007AFF]" />
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Customer (Pelanggan)</h3>
            </div>
            <span className="text-xs font-mono font-medium text-[#6E6E73]">{customers.length} terdaftar</span>
          </div>

          {customers.length === 0 ? (
            <p className="text-xs text-[#8E8E93] italic py-4 text-center">Belum ada customer terdaftar.</p>
          ) : (
            <div className="divide-y divide-black/[0.06]">
              {customers.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs font-medium">
                  <div>
                    <span className="font-semibold text-[#1D1D1F] block">{c.name}</span>
                    <span className="text-[10px] font-mono text-[#6E6E73]">{c.code} · {c.phone || 'No phone'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sparepart Categories */}
        <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#34C759]" />
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Kategori Sparepart</h3>
            </div>
            <span className="text-xs font-mono font-medium text-[#6E6E73]">{sparepartCategories.length} Kategori</span>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {sparepartCategories.map((cat) => (
              <div key={cat.id} className="py-2 flex items-center justify-between text-xs font-medium">
                <span className="text-[#1D1D1F]">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Income Categories */}
        <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#34C759]" />
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Kategori Pemasukan</h3>
            </div>
            <span className="text-xs font-mono font-medium text-[#6E6E73]">{incomeCategories.length} Kategori</span>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {incomeCategories.map((cat) => (
              <div key={cat.id} className="py-2 flex items-center justify-between text-xs font-medium">
                <span className="text-[#1D1D1F]">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-[#FF3B30]" />
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Kategori Pengeluaran</h3>
            </div>
            <span className="text-xs font-mono font-medium text-[#6E6E73]">{expenseCategories.length} Kategori</span>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {expenseCategories.map((cat) => (
              <div key={cat.id} className="py-2 flex items-center justify-between text-xs font-medium">
                <span className="text-[#1D1D1F]">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
