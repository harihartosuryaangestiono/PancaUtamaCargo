import { requireAuth } from '@/lib/session'
import { getTiresAction } from '@/app/actions/tireActions'
import { getTrucksAction } from '@/app/actions/truckActions'
import { getCompanySettingsAction } from '@/app/actions/settingsActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatKm, formatPercent } from '@/lib/utils/format'
import { Disc } from 'lucide-react'
import { CreateTireModal } from './CreateTireModal'
import { InstallTireModal } from '@/components/tires/InstallTireModal'
import { TireCompareModal } from '@/components/tires/TireCompareModal'
import Link from 'next/link'

export default async function TiresPage() {
  const session = await requireAuth()
  const tires = await getTiresAction()
  const trucks = await getTrucksAction()
  const settings = await getCompanySettingsAction()

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20">ACTIVE</span>
      case 'WARNING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#C67300] border border-[#FF9500]/20">WARNING</span>
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20">CRITICAL</span>
      case 'REPLACEMENT_DUE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">REPLACEMENT DUE</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F2F2F7] text-[#6E6E73] border border-black/[0.06]">{status}</span>
    }
  }

  const formattedTires = tires.map((t: any) => ({
    id: t.id,
    tireCode: t.tireCode,
    brand: t.brand,
    model: t.model,
    size: t.size,
    serialNumber: t.serialNumber,
    purchasePrice: t.purchasePrice ? Number(t.purchasePrice) : null,
    currentKm: t.currentKm,
    expectedLifetimeKm: t.expectedLifetimeKm,
    remainingLifetimeKm: t.remainingLifetimeKm,
    status: t.status,
  }))

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <h2 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
            Manajemen Ban &amp; Lifecycle Standard 60.000 KM
          </h2>
          <p className="text-xs text-[#6E6E73] font-medium mt-1">
            Perhitungan akumulasi KM lintas periode pemasangan &amp; komparasi performa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tires.length > 0 && <TireCompareModal tires={formattedTires} />}

          {session.role === 'OWNER' && (
            <CreateTireModal defaultTireLifetimeKm={settings.defaultTireLifetimeKm} />
          )}
        </div>
      </div>

      {tires.length === 0 ? (
        <EmptyState
          icon={Disc}
          title="Belum Ada Ban Terdaftar"
          description="Database ban saat ini masih 0. Daftarkan ban baru dan tentukan harga pembelian serta expected lifetime (default 60.000 KM)."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFAFA] text-[#6E6E73] uppercase tracking-wider font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">Kode Ban / Serial Number</th>
                  <th className="py-3.5 px-4">Merk &amp; Ukuran</th>
                  <th className="py-3.5 px-4">Posisi Terpasang</th>
                  <th className="py-3.5 px-4">Pemakaian KM / Target</th>
                  <th className="py-3.5 px-4">Usage %</th>
                  <th className="py-3.5 px-4">Sisa KM</th>
                  <th className="py-3.5 px-4">Status Health</th>
                  <th className="py-3.5 px-4 text-right">Aksi Pemasangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {tires.map((t: any) => {
                  const usagePercent = t.expectedLifetimeKm > 0 ? (t.currentKm / t.expectedLifetimeKm) * 100 : 0
                  return (
                    <tr key={t.id} className="hover:bg-[#F5F5F7] transition-colors">
                      <td className="py-3.5 px-4">
                        <Link href={`/tires/${t.id}`} className="font-semibold text-[#1D1D1F] hover:text-[#007AFF] transition-colors block">
                          {t.tireCode}
                        </Link>
                        <span className="text-[10px] font-mono text-[#6E6E73]">SN: {t.serialNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#1D1D1F] font-semibold">
                        {t.brand} {t.model} ({t.size})
                      </td>
                      <td className="py-3.5 px-4">
                        {t.currentPosition ? (
                          <span className="px-2.5 py-1 bg-[#007AFF]/10 text-[#007AFF] font-semibold rounded-xl text-[10px] border border-[#007AFF]/20">
                            {t.currentPosition.positionCode} ({t.currentPosition.truck.policeNumber})
                          </span>
                        ) : (
                          <span className="text-[#8E8E93] italic font-mono text-[11px]">Di Gudang (Unmounted)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#1D1D1F]">
                        {formatKm(t.currentKm)} / {formatKm(t.expectedLifetimeKm)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-24 bg-[#F2F2F7] h-2.5 rounded-full overflow-hidden mb-1 border border-black/[0.04]">
                          <div
                            className={`h-full rounded-full ${
                              t.status === 'REPLACEMENT_DUE'
                                ? 'bg-[#FF3B30]'
                                : t.status === 'CRITICAL'
                                ? 'bg-[#FF9500]'
                                : t.status === 'WARNING'
                                ? 'bg-[#FF9500]'
                                : 'bg-[#34C759]'
                            }`}
                            style={{ width: `${Math.min(100, usagePercent)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#6E6E73] font-mono">{formatPercent(usagePercent)}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#1D1D1F]">
                        {formatKm(t.remainingLifetimeKm)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusPill(t.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!t.currentPosition ? (
                          <InstallTireModal
                            tireId={t.id}
                            tireCode={t.tireCode}
                            serialNumber={t.serialNumber}
                            trucks={trucks}
                          />
                        ) : (
                          <Link
                            href={`/tires/${t.id}`}
                            className="px-3 py-1 text-[11px] font-semibold text-[#007AFF] hover:text-[#0062CC] bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-lg transition-colors"
                          >
                            Detail &rarr;
                          </Link>
                        )}
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
