import { requireAuth } from '@/lib/session'
import { getContractsAction } from '@/app/actions/contractActions'
import { getCustomersAction } from '@/app/actions/masterDataActions'
import { getTrucksAction } from '@/app/actions/truckActions'
import { getDriversAction } from '@/app/actions/driverActions'
import { CreateContractModal } from './CreateContractModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import { FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { EditContractCostsModal } from './EditContractCostsModal'

export default async function ContractsPage() {
  const session = await requireAuth()
  const [contracts, customers, trucks, drivers] = await Promise.all([
    getContractsAction(),
    getCustomersAction(),
    getTrucksAction(),
    getDriversAction(),
  ])

  const activeCount = contracts.filter((c: any) => c.status === 'IN_PROGRESS').length
  const completedCount = contracts.filter((c: any) => c.status === 'COMPLETED').length
  let totalRev = 0
  for (const c of contracts) {
    totalRev += c.totalRevenue
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase">IN PROGRESS</span>
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20 uppercase">COMPLETED</span>
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 uppercase">CANCELLED</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#C67300] border border-[#FF9500]/20 uppercase">PLANNED</span>
    }
  }

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
            Kontrak Perjalanan (Round Trip ERP)
          </h1>
          <p className="text-xs text-[#6E6E73] font-medium mt-1">
            Manajemen kontrak armada tronton: 1 Kontrak = 2 ERP (Berangkat &amp; Pulang), Pembagian 53%/47%, Uang Jalan &amp; Totalan Supir.
          </p>
        </div>

        {session.role === 'OWNER' && (
          <CreateContractModal
            customers={customers.map((c: any) => ({ id: c.id, name: c.name }))}
            trucks={trucks.map((t: any) => ({ id: t.id, policeNumber: t.policeNumber, brand: t.brand, model: t.model }))}
            drivers={drivers.map((d: any) => ({ id: d.id, driverCode: d.driverCode, name: d.name, status: d.status }))}
          />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5">
          <span className="text-[11px] font-medium text-[#6E6E73]">Total Kontrak Perjalanan</span>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1">{contracts.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5">
          <span className="text-[11px] font-medium text-[#007AFF]">Kontrak Berjalan (In Progress)</span>
          <p className="text-2xl font-semibold text-[#007AFF] mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5">
          <span className="text-[11px] font-medium text-[#34C759]">Kontrak Selesai (Completed)</span>
          <p className="text-2xl font-semibold text-[#34C759] mt-1">{completedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5">
          <span className="text-[11px] font-medium text-[#6E6E73]">Total Contract Revenue</span>
          <p className="text-2xl font-semibold text-[#34C759] mt-1">
            {formatCurrency(totalRev > 0 ? totalRev : null)}
          </p>
        </div>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum Ada Kontrak Perjalanan"
          description="Database kontrak perjalanan saat ini masih kosong. Silakan buat kontrak pertama untuk menjadwalkan perjalanan ERP armada."
        />
      ) : (
        <div className="space-y-4">
          {contracts.map((c: any) => {
            const outLeg = c.legs.find((l: any) => l.legNumber === 1) || c.legs[0]
            const retLeg = c.legs.find((l: any) => l.legNumber === 2) || c.legs[1]

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-[#007AFF]/10 text-[#007AFF] font-semibold font-mono text-xs border border-[#007AFF]/20">
                      {c.contractNumber}
                    </span>
                    <div>
                      <h3 className="font-semibold text-[#1D1D1F] text-sm">
                        {c.customer?.name} · Driver: {c.driverName}
                      </h3>
                      <p className="text-xs font-mono text-[#6E6E73] mt-0.5">
                        Armada: {c.truck?.policeNumber} ({c.truck?.brand} {c.truck?.model})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(c.status)}
                    {session.role === 'OWNER' && (
                      <EditContractCostsModal
                        contract={c}
                        customers={customers.map((cust: any) => ({ id: cust.id, name: cust.name }))}
                        trucks={trucks.map((t: any) => ({ id: t.id, policeNumber: t.policeNumber, brand: t.brand, model: t.model }))}
                        drivers={drivers.map((d: any) => ({ id: d.id, driverCode: d.driverCode, name: d.name, status: d.status }))}
                      />
                    )}
                    <Link
                      href={`/contracts/${c.id}/surat-jalan`}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F5F7] text-[#007AFF] text-xs font-semibold border border-black/[0.08] transition-colors"
                      title="Cetak Surat Jalan Cargo"
                    >
                      Cetak Surat Jalan
                    </Link>
                    <Link
                      href={`/contracts/${c.id}/invoice`}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F5F7] text-[#248A3D] text-xs font-semibold border border-black/[0.08] transition-colors"
                      title="Cetak Invoice Tagihan Pelanggan"
                    >
                      Cetak Invoice
                    </Link>
                    <Link
                      href={`/contracts/${c.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold border border-black/[0.06] transition-colors"
                    >
                      Detail &amp; Totalan &rarr;
                    </Link>
                  </div>
                </div>

                {/* 2-Leg Visual Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Outbound Leg */}
                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#007AFF] uppercase tracking-wider text-[10px]">
                        ERP 1 · BERANGKAT (OUTBOUND)
                      </span>
                      <span className="font-semibold text-[#1D1D1F]">{formatCurrency(outLeg?.contractValue ? Number(outLeg.contractValue) : null)}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-[#1D1D1F]">
                      <span>{outLeg?.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                      <span>{outLeg?.destination}</span>
                    </div>
                    <p className="text-[#6E6E73] text-[11px]">
                      Muatan: {outLeg?.cargoType} ({outLeg?.cargoWeightTon} Ton) · Jarak: {formatKm(outLeg?.distanceKm || 0)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6E6E73] pt-2 border-t border-black/[0.06]">
                      <span>Tol: <strong className="text-[#1D1D1F] font-semibold">{formatCurrency(outLeg?.tollCost ? Number(outLeg.tollCost) : 0)}</strong></span>
                      <span>Inap: <strong className="text-[#1D1D1F] font-semibold">{formatCurrency(outLeg?.otherCost ? Number(outLeg.otherCost) : 0)}</strong></span>
                      <span>BBM: <strong className="text-[#1D1D1F] font-semibold">{formatCurrency(outLeg?.fuelCost ? Number(outLeg.fuelCost) : 0)}</strong></span>
                    </div>
                  </div>

                  {/* Return Leg */}
                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#34C759] uppercase tracking-wider text-[10px]">
                        ERP 2 · PULANG (RETURN)
                      </span>
                      <span className="font-semibold text-[#1D1D1F]">{formatCurrency(retLeg?.contractValue ? Number(retLeg.contractValue) : null)}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-[#1D1D1F]">
                      <span>{retLeg?.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                      <span>{retLeg?.destination}</span>
                    </div>
                    <p className="text-[#6E6E73] text-[11px]">
                      Muatan: {retLeg?.cargoType} ({retLeg?.cargoWeightTon} Ton) · Jarak: {formatKm(retLeg?.distanceKm || 0)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6E6E73] pt-2 border-t border-black/[0.06]">
                      <span>Tol: <strong className="text-[#1D1D1F] font-semibold">{formatCurrency(retLeg?.tollCost ? Number(retLeg.tollCost) : 0)}</strong></span>
                      <span>Inap: <strong className="text-[#1D1D1F] font-semibold">{formatCurrency(retLeg?.otherCost ? Number(retLeg.otherCost) : 0)}</strong></span>
                      <span>BBM: <strong className="text-[#1D1D1F] font-semibold">{formatCurrency(retLeg?.fuelCost ? Number(retLeg.fuelCost) : 0)}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
