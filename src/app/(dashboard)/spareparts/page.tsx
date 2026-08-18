import { requireAuth } from '@/lib/session'
import { getSparepartsAction } from '@/app/actions/sparepartActions'
import { getSparepartCategoriesAction } from '@/app/actions/masterDataActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils/format'
import { Package } from 'lucide-react'
import { CreateSparepartModal } from './CreateSparepartModal'

export default async function SparepartsPage() {
  const session = await requireAuth()
  const spareparts = await getSparepartsAction()
  const categories = await getSparepartCategoriesAction()

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
            Inventory &amp; Stok Sparepart
          </h2>
          <p className="text-xs text-[#6E6E73]">
            Master sparepart, transaksi pembelian, dan pencatatan pemakaian pada truck.
          </p>
        </div>

        {session.role === 'OWNER' && (
          <CreateSparepartModal categories={categories.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))} />
        )}
      </div>

      {spareparts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum Ada Master Sparepart"
          description="Database sparepart saat ini masih kosong. Daftarkan master sparepart baru untuk memulai manajemen stok inventory."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Daftar Stok Inventory</h3>
            <span className="text-xs text-[#6E6E73] font-medium">Total: {spareparts.length} item</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFAFA] text-[#6E6E73] uppercase tracking-wider font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">Part Number / Nama</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Stok Saat Ini</th>
                  <th className="py-3.5 px-4">Min. Stock Alert</th>
                  <th className="py-3.5 px-4">Harga Beli Terakhir</th>
                  <th className="py-3.5 px-4">Rata-Rata Harga Beli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {spareparts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#1D1D1F] block">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono text-[#6E6E73]">{p.partNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      {p.category.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${
                        p.currentStock <= p.minStock
                          ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20'
                          : 'bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20'
                      }`}>
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      {p.minStock} {p.unit}
                    </td>
                    <td className="py-3.5 px-4 text-[#1D1D1F] font-mono font-semibold">
                      {formatCurrency(p.lastPurchasePrice ? Number(p.lastPurchasePrice) : null)}
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73] font-mono">
                      {formatCurrency(p.avgPurchasePrice ? Number(p.avgPurchasePrice) : null)}
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
