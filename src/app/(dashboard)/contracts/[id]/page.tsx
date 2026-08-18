import { requireAuth } from '@/lib/session'
import { getContractByIdAction } from '@/app/actions/contractActions'
import { ContractDetailClient } from './ContractDetailClient'
import { formatCurrency, formatKm, formatDate } from '@/lib/utils/format'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ContractDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ContractDetailPage({ params }: ContractDetailPageProps) {
  const session = await requireAuth()
  const { id } = await params
  const contract = await getContractByIdAction(id)

  if (!contract) {
    notFound()
  }

  const outLeg = contract.legs.find((l: any) => l.legNumber === 1) || contract.legs[0]
  const retLeg = contract.legs.find((l: any) => l.legNumber === 2) || contract.legs[1]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase">IN PROGRESS</span>
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20 uppercase">COMPLETED</span>
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 uppercase">CANCELLED</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FF9500]/10 text-[#C67300] border border-[#FF9500]/20 uppercase">PLANNED</span>
    }
  }

  return (
    <div className="space-y-8 text-[#1D1D1F]">
      {/* Back CTA */}
      <div>
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Kontrak Perjalanan
        </Link>

        {/* Contract Header Profile Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-[#007AFF]/10 text-[#007AFF] font-semibold font-mono text-xs border border-[#007AFF]/20">
                {contract.contractNumber}
              </span>
              {getStatusBadge(contract.status)}
            </div>
            <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
              Kontrak Perjalanan: {contract.customer?.name}
            </h1>
            <p className="text-xs font-mono text-[#6E6E73]">
              Supir: <span className="font-semibold text-[#1D1D1F]">{contract.driverName}</span> · Armada: <span className="font-semibold text-[#007AFF]">{contract.truck?.policeNumber}</span> ({contract.truck?.brand} {contract.truck?.model})
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-[#6E6E73] border-t md:border-t-0 md:border-l border-black/[0.06] pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="block text-[10px] text-[#6E6E73]">Total Value Kontrak</span>
              <span className="font-semibold text-base text-[#34C759]">
                {formatCurrency(contract.totalRevenue)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#6E6E73]">Tanggal Mulai</span>
              <span className="font-mono font-semibold text-[#1D1D1F]">
                {formatDate(contract.startDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Action Buttons (Record Advance / Totalan Supir) */}
      <ContractDetailClient contract={contract} userRole={session.role} />

      {/* Visual Trip Timeline Card (ERP 1 Outbound & ERP 2 Return) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-6">
        <h3 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest">
          Visual Trip Timeline (Round-Trip ERP 1 &amp; ERP 2)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ERP 1 Outbound */}
          <div className="p-5 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] uppercase">
                ERP 1 · BERANGKAT (OUTBOUND)
              </span>
              <span className="font-semibold text-[#1D1D1F] text-sm">
                {formatCurrency(outLeg?.contractValue ? Number(outLeg.contractValue) : null)}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm font-semibold text-[#1D1D1F]">
              <span>{outLeg?.origin}</span>
              <ArrowRight className="w-4 h-4 text-[#007AFF]" />
              <span>{outLeg?.destination}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-[#6E6E73]">
              <div>Muatan: <span className="font-semibold text-[#1D1D1F]">{outLeg?.cargoType}</span></div>
              <div>Berat: <span className="font-semibold text-[#1D1D1F]">{outLeg?.cargoWeightTon} Ton</span></div>
              <div>Jarak: <span className="font-semibold text-[#1D1D1F]">{formatKm(outLeg?.distanceKm || 0)}</span></div>
              <div>Tol: <span className="font-semibold text-[#1D1D1F]">{formatCurrency(outLeg?.tollCost ? Number(outLeg.tollCost) : null)}</span></div>
            </div>

            <div className="p-3 rounded-xl bg-white text-[11px] space-y-1 border border-black/[0.06]">
              <div className="flex justify-between">
                <span className="text-[#6E6E73]">Tol Perusahaan (60%):</span>
                <span className="font-semibold text-[#007AFF]">{formatCurrency(outLeg?.companyTollCost ? Number(outLeg.companyTollCost) : null)}</span>
              </div>
              <div className="flex justify-between text-[#6E6E73]">
                <span>Tol Supir (40%):</span>
                <span className="font-semibold text-[#1D1D1F]">{formatCurrency(outLeg?.driverTollCost ? Number(outLeg.driverTollCost) : null)}</span>
              </div>
            </div>
          </div>

          {/* ERP 2 Return */}
          <div className="p-5 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] uppercase">
                ERP 2 · PULANG (RETURN)
              </span>
              <span className="font-semibold text-[#1D1D1F] text-sm">
                {formatCurrency(retLeg?.contractValue ? Number(retLeg.contractValue) : null)}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm font-semibold text-[#1D1D1F]">
              <span>{retLeg?.origin}</span>
              <ArrowRight className="w-4 h-4 text-[#34C759]" />
              <span>{retLeg?.destination}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-[#6E6E73]">
              <div>Muatan: <span className="font-semibold text-[#1D1D1F]">{retLeg?.cargoType}</span></div>
              <div>Berat: <span className="font-semibold text-[#1D1D1F]">{retLeg?.cargoWeightTon} Ton</span></div>
              <div>Jarak: <span className="font-semibold text-[#1D1D1F]">{formatKm(retLeg?.distanceKm || 0)}</span></div>
              <div>Tol: <span className="font-semibold text-[#1D1D1F]">{formatCurrency(retLeg?.tollCost ? Number(retLeg.tollCost) : null)}</span></div>
            </div>

            <div className="p-3 rounded-xl bg-white text-[11px] space-y-1 border border-black/[0.06]">
              <div className="flex justify-between">
                <span className="text-[#6E6E73]">Tol Perusahaan (60%):</span>
                <span className="font-semibold text-[#007AFF]">{formatCurrency(retLeg?.companyTollCost ? Number(retLeg.companyTollCost) : null)}</span>
              </div>
              <div className="flex justify-between text-[#6E6E73]">
                <span>Tol Supir (40%):</span>
                <span className="font-semibold text-[#1D1D1F]">{formatCurrency(retLeg?.driverTollCost ? Number(retLeg.driverTollCost) : null)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Financial Waterfall Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Allocation Card */}
        <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest">
            Pembagian Hasil (Potongan 2% &rarr; 53% Supir / 47% Perusahaan)
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-[#FAFAFA]">
              <span className="text-[#6E6E73]">Total Nilai Kontrak Kotor (ERP 1 + ERP 2):</span>
              <span className="font-semibold text-[#1D1D1F]">{formatCurrency(contract.totalRevenue)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="font-semibold text-[#FF3B30]">Potongan 2% (Tax / Fee):</span>
              <span className="font-semibold text-[#FF3B30]">-{formatCurrency(contract.taxDeduction)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="font-semibold text-[#248A3D]">Total Diterima Perusahaan (98% Net):</span>
              <span className="font-semibold text-[#248A3D]">{formatCurrency(contract.netContractValue)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="font-semibold text-[#C67300]">Bagian Supir (Driver Share 53% dari Net):</span>
              <span className="font-semibold text-[#C67300]">{formatCurrency(contract.driverAllocation)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="font-semibold text-[#007AFF]">Bagian Perusahaan (Company Share 47% dari Net):</span>
              <span className="font-semibold text-[#007AFF]">{formatCurrency(contract.companyAllocation)}</span>
            </div>
          </div>
        </div>

        {/* Company Net Result Card */}
        <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest">
            Laba Kontribusi Perusahaan (Company Result)
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Bagian Perusahaan (47% dari Net):</span>
              <span className="font-semibold text-[#1D1D1F]">{formatCurrency(contract.companyAllocation)}</span>
            </div>
            <div className="flex justify-between text-[#FF3B30]">
              <span>Beban Tol Perusahaan (60%):</span>
              <span className="font-semibold">-{formatCurrency(contract.totalCompanyToll)}</span>
            </div>
            <div className="flex justify-between text-[#FF3B30]">
              <span>Beban BBM Perusahaan:</span>
              <span className="font-semibold">-{formatCurrency(contract.totalFuelCost)}</span>
            </div>
            <div className="flex justify-between text-[#FF3B30]">
              <span>Beban Lainnya:</span>
              <span className="font-semibold">-{formatCurrency(contract.totalOtherCost)}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 text-sm font-semibold">
              <span className="text-[#248A3D]">Net Company Contribution:</span>
              <span className="text-[#248A3D]">{formatCurrency(contract.netCompanyContribution)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
