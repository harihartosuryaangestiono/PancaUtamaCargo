import { requireAuth } from '@/lib/session'
import { getTireByIdAction } from '@/app/actions/tireActions'
import { notFound } from 'next/navigation'
import { formatCurrency, formatKm, formatPercent, formatDate } from '@/lib/utils/format'
import { Disc, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

interface TireDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TireDetailPage({ params }: TireDetailPageProps) {
  const session = await requireAuth()
  const { id } = await params
  const tire = await getTireByIdAction(id)

  if (!tire) {
    notFound()
  }

  const usagePercent = tire.expectedLifetimeKm > 0 ? (tire.currentKm / tire.expectedLifetimeKm) * 100 : 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'ACTIVE', color: 'bg-[#34C759]/10 text-[#248A3D] border-[#34C759]/20' }
      case 'WARNING':
        return { label: 'WARNING (70%-90%)', color: 'bg-[#FF9500]/10 text-[#C67300] border-[#FF9500]/20' }
      case 'CRITICAL':
        return { label: 'CRITICAL (90%-100%)', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' }
      case 'REPLACEMENT_DUE':
        return { label: 'REPLACEMENT DUE (≥100%)', color: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20' }
      case 'REPLACED':
        return { label: 'REPLACED / RETIRED', color: 'bg-[#F5F5F7] text-[#6E6E73] border-black/[0.08]' }
      default:
        return { label: status, color: 'bg-[#F5F5F7] text-[#6E6E73] border-black/[0.08]' }
    }
  }

  const badge = getStatusBadge(tire.status)

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Back CTA */}
      <div>
        <Link
          href="/tires"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Ban
        </Link>

        {/* Profile Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] font-bold text-xl flex items-center justify-center border border-[#007AFF]/20 shrink-0">
              <Disc className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 font-mono uppercase">
                  {tire.tireCode}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                {tire.brand} {tire.model} ({tire.size})
              </h1>
              <p className="text-xs font-mono text-[#6E6E73] mt-0.5">
                SN: {tire.serialNumber} · Pembelian: {formatDate(tire.purchaseDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-[#6E6E73] border-t md:border-t-0 md:border-l border-black/[0.06] pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="block text-[10px] text-[#8E8E93]">Harga Pembelian</span>
              <span className="font-semibold text-[#1D1D1F]">
                {formatCurrency(tire.purchasePrice ? Number(tire.purchasePrice) : null)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#8E8E93]">Lokasi Saat Ini</span>
              <span className="font-semibold text-[#007AFF]">
                {tire.currentPosition
                  ? `${tire.currentPosition.positionCode} (${tire.currentPosition.truck.policeNumber})`
                  : 'Gudang (Unmounted)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifetime Health Card */}
      <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1D1D1F]">Indikator Lifecycle &amp; Health Ban</h3>
          <span className="text-xs font-mono font-semibold text-[#6E6E73]">Target Lifetime: {formatKm(tire.expectedLifetimeKm)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-[#6E6E73]">Pemakaian Akumulasi KM:</span>
            <span className="font-semibold text-[#1D1D1F] font-mono">
              {formatKm(tire.currentKm)} / {formatKm(tire.expectedLifetimeKm)} ({formatPercent(usagePercent)})
            </span>
          </div>

          <div className="w-full h-4 bg-[#F5F5F7] rounded-full overflow-hidden p-0.5 border border-black/[0.08]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                tire.status === 'REPLACEMENT_DUE'
                  ? 'bg-[#FF3B30]'
                  : tire.status === 'CRITICAL'
                  ? 'bg-orange-500'
                  : tire.status === 'WARNING'
                  ? 'bg-[#FF9500]'
                  : 'bg-[#34C759]'
              }`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-[#6E6E73] font-medium">
            <span>Pemakaian: {formatPercent(usagePercent)}</span>
            <span>Sisa Usia Pakai: {formatKm(tire.remainingLifetimeKm)}</span>
          </div>
        </div>
      </div>

      {/* Lifetime History Timeline */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F] tracking-tight">
              LIFETIME HISTORY &amp; MOVEMENT TIMELINE
            </h3>
            <p className="text-xs text-[#6E6E73]">
              Riwayat kronologis pembelian, pemasangan, rotasi, dan pelepasan ban.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-[#6E6E73]">{tire.movements.length} Events</span>
        </div>

        {tire.movements.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8E8E93]">Belum ada riwayat pergerakan ban.</div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-black/[0.08]">
            {tire.movements.map((log: any) => (
              <div key={log.id} className="relative flex items-start gap-4 text-xs">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-[10px] font-semibold ring-4 ring-white">
                  <Clock className="w-3 h-3" />
                </div>
                <div className="flex-1 bg-[#FAFAFA] p-4 rounded-xl border border-black/[0.06]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#1D1D1F] uppercase tracking-wider text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] font-mono text-[#6E6E73]">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[#1D1D1F] font-medium">{log.reason || 'No description'}</p>
                  <div className="flex items-center gap-4 text-[10px] text-[#6E6E73] font-mono mt-2">
                    <span>Odometer: {formatKm(log.kmAtMovement)}</span>
                    {log.fromPosCode && <span>Dari: {log.fromPosCode}</span>}
                    {log.toPosCode && <span>Ke: {log.toPosCode}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
