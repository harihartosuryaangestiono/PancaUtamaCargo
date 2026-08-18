import { requireAuth } from '@/lib/session'
import { getCustomersAction } from '@/app/actions/customerActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users as UsersIcon, Phone, Mail, MapPin, Package } from 'lucide-react'
import Link from 'next/link'
import { CreateCustomerModal } from './CreateCustomerModal'

export default async function CustomersPage() {
  const session = await requireAuth()
  const customers = await getCustomersAction()

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase tracking-wider">
              Pelanggan &amp; Client
            </span>
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">Manajemen Pelanggan</h2>
          <p className="text-xs text-[#6E6E73]">
            Kelola data mitra bisnis, riwayat pengiriman cargo, dan profil pembayaran.
          </p>
        </div>

        <CreateCustomerModal />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6E6E73]">Total Pelanggan Terdaftar</span>
            <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <UsersIcon className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
            {customers.length} Mitra
          </h3>
          <p className="text-[11px] text-[#6E6E73] mt-1">Pelanggan aktif tercatat di database</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6E6E73]">Aktivitas Pengiriman &amp; Kontrak</span>
            <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 text-[#248A3D] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
            {customers.reduce((acc, c: any) => acc + (c._count.shipments || 0) + (c._count.tripContracts || 0), 0)} Total Transaksi
          </h3>
          <p className="text-[11px] text-[#6E6E73] mt-1">Akumulasi pengiriman &amp; kontrak seluruh pelanggan</p>
        </div>
      </div>

      {/* Customers List / Table */}
      {customers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Belum Ada Data Pelanggan"
          description="Database pelanggan masih kosong. Daftarkan pelanggan baru untuk mencatat transaksi pengiriman cargo."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
            <h3 className="font-semibold text-[#1D1D1F] text-sm">Daftar Pelanggan Terdaftar</h3>
            <span className="text-xs text-[#6E6E73] font-mono">{customers.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                  <th className="py-3 px-4">Kode &amp; Nama</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Alamat</th>
                  <th className="py-3 px-4 text-center">Total Pengiriman &amp; Kontrak</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] text-xs font-medium">
                {customers.map((c: any) => {
                  const totalCount = (c._count.shipments || 0) + (c._count.tripContracts || 0)
                  return (
                    <tr key={c.id} className="hover:bg-[#F5F5F7] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 text-[#007AFF] font-bold text-xs flex items-center justify-center border border-[#007AFF]/20">
                            {c.code.slice(0, 2)}
                          </div>
                          <div>
                            <Link href={`/customers/${c.id}`} className="font-semibold text-[#1D1D1F] hover:text-[#007AFF] transition-colors">
                              {c.name}
                            </Link>
                            <p className="text-[10px] text-[#6E6E73] font-mono">{c.code}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#6E6E73]">
                        <div className="space-y-0.5">
                          {c.phone && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Phone className="w-3 h-3 text-[#8E8E93]" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Mail className="w-3 h-3 text-[#8E8E93]" />
                              <span>{c.email}</span>
                            </div>
                          )}
                          {!c.phone && !c.email && <span className="text-[#8E8E93] italic text-[11px]">-</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#6E6E73] max-w-xs truncate">
                        {c.address ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-[#8E8E93] shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        ) : (
                          <span className="text-[#8E8E93] italic text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F5F7] text-[#1D1D1F] border border-black/[0.06]">
                          {totalCount} Transaksi
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/customers/${c.id}`}
                          className="px-3 py-1 text-[11px] font-semibold text-[#007AFF] hover:text-[#0062CC] bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-lg transition-colors"
                        >
                          Detail &rarr;
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
