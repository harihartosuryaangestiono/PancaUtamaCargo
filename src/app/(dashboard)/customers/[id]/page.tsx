import { requireAuth } from '@/lib/session'
import { getCustomerByIdAction } from '@/app/actions/customerActions'
import { notFound } from 'next/navigation'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import { Phone, Mail, MapPin, Package, ArrowLeft, Calendar, Truck, DollarSign, FileText } from 'lucide-react'
import Link from 'next/link'
import { DeleteCustomerButton } from './DeleteCustomerButton'

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const session = await requireAuth()
  const { id } = await params
  const customer = await getCustomerByIdAction(id)

  if (!customer) {
    notFound()
  }

  const legacyRevenue = customer.incomes.reduce((acc: number, inc: any) => acc + Number(inc.amount), 0)
  const contractRevenue = (customer.tripContracts || []).reduce((acc: number, c: any) => acc + Number(c.totalRevenue || 0), 0)
  const totalRevenue = legacyRevenue > 0 ? legacyRevenue : contractRevenue

  const legacyKm = customer.shipments.reduce((acc: number, s: any) => acc + s.totalKm, 0)
  const contractKm = (customer.tripContracts || []).reduce((acc: number, c: any) => {
    const legsKm = (c.legs || []).reduce((lAcc: number, leg: any) => lAcc + (leg.distanceKm || 0), 0)
    return acc + legsKm
  }, 0)
  const totalKm = legacyKm + contractKm

  const totalTransCount = customer.shipments.length + (customer.tripContracts || []).length

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Back Button & Header */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pelanggan
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] font-bold text-lg flex items-center justify-center border border-[#007AFF]/20">
              {customer.code.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F5F5F7] text-[#6E6E73] font-mono uppercase border border-black/[0.06]">
                  {customer.code}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
                {customer.name}
              </h2>
            </div>
          </div>

          {session.role === 'OWNER' && (
            <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />
          )}
        </div>
      </div>

      {/* Customer Info & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Contact Info Card */}
        <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-3">
          <h3 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Informasi Kontak</h3>
          <div className="space-y-2 text-xs text-[#1D1D1F]">
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#8E8E93] shrink-0" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#8E8E93] shrink-0" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#8E8E93] shrink-0 mt-0.5" />
                <span>{customer.address}</span>
              </div>
            )}
            {!customer.phone && !customer.email && !customer.address && (
              <p className="text-[#8E8E93] italic">Belum ada informasi kontak detail.</p>
            )}
          </div>
        </div>

        {/* Total Transaksi Card */}
        <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6E6E73]">Total Kontrak &amp; Pengiriman</span>
            <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
            {totalTransCount} Transaksi
          </h3>
          <p className="text-[11px] text-[#6E6E73] mt-1">Total Jarak Tempuh: {formatKm(totalKm)}</p>
        </div>

        {/* Total Revenue Card */}
        <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6E6E73]">Total Pemasukan Omset</span>
            <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 text-[#248A3D] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
            {formatCurrency(totalRevenue > 0 ? totalRevenue : null)}
          </h3>
          <p className="text-[11px] text-[#6E6E73] mt-1">Akumulasi pendapatan transaksi</p>
        </div>
      </div>

      {/* ERP Trip Contracts History Table */}
      {(customer.tripContracts || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
            <h3 className="font-semibold text-[#1D1D1F] text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#007AFF]" /> Riwayat Kontrak Perjalanan (ERP Tronton)
            </h3>
            <span className="text-xs text-[#6E6E73] font-mono">{customer.tripContracts.length} Kontrak</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                  <th className="py-3 px-4">No. Kontrak &amp; Tanggal</th>
                  <th className="py-3 px-4">Truck Tronton</th>
                  <th className="py-3 px-4">Pengemudi (Driver)</th>
                  <th className="py-3 px-4 text-right">Nilai Kontrak</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {customer.tripContracts.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3.5 px-4">
                      <Link href={`/contracts/${c.id}`} className="font-mono font-semibold text-[#007AFF] hover:underline">
                        {c.contractNumber}
                      </Link>
                      <div className="flex items-center gap-1 text-[10px] text-[#6E6E73] mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(c.startDate).toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#1D1D1F]">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#8E8E93]" />
                        <span>{c.truck?.policeNumber || '-'} ({c.truck?.truckCode || '-'})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#1D1D1F]">{c.driverName}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#248A3D]">
                      {formatCurrency(c.totalRevenue ? Number(c.totalRevenue) : null)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="px-3 py-1 text-[11px] font-semibold text-[#007AFF] hover:text-[#0062CC] bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-lg transition-colors"
                      >
                        Detail &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legacy Shipment History Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
          <h3 className="font-semibold text-[#1D1D1F] text-sm">Riwayat Pengiriman Surat Jalan</h3>
          <span className="text-xs text-[#6E6E73] font-mono">{customer.shipments.length} Pengiriman</span>
        </div>

        {customer.shipments.length === 0 && (customer.tripContracts || []).length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8E8E93]">
            Belum ada riwayat pengiriman atau kontrak untuk pelanggan ini.
          </div>
        ) : customer.shipments.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#6E6E73]">
            Pengiriman tercatat pada tabel Kontrak Perjalanan ERP di atas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                  <th className="py-3 px-4">Surat Jalan &amp; Tanggal</th>
                  <th className="py-3 px-4">Truck</th>
                  <th className="py-3 px-4">Rute Pengiriman</th>
                  <th className="py-3 px-4 text-right">Jarak (KM)</th>
                  <th className="py-3 px-4 text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] text-xs font-medium">
                {customer.shipments.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1D1D1F] font-mono">{s.shipmentNumber}</p>
                      <div className="flex items-center gap-1 text-[10px] text-[#6E6E73] mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(s.date).toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#1D1D1F]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Truck className="w-3.5 h-3.5 text-[#8E8E93]" />
                        <span>{s.truck.policeNumber} ({s.truck.truckCode})</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      <span>{s.origin} &rarr; {s.destination}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#1D1D1F] font-medium">
                      {formatKm(s.totalKm)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#248A3D]">
                      {formatCurrency(s.revenue ? Number(s.revenue) : null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
