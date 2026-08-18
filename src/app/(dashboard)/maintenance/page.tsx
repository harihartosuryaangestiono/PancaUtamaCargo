import { requireAuth } from '@/lib/session'
import { getMaintenancesAction } from '@/app/actions/maintenanceActions'
import { getTrucksAction } from '@/app/actions/truckActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatKm, formatDate } from '@/lib/utils/format'
import { Wrench } from 'lucide-react'
import { CreateMaintenanceModal } from './CreateMaintenanceModal'

export default async function MaintenancePage() {
  const session = await requireAuth()
  const logs = await getMaintenancesAction()
  const trucks = await getTrucksAction()

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
            Maintenance &amp; Riwayat Perbaikan Truck
          </h2>
          <p className="text-xs text-[#6E6E73]">
            Servis rutin, perbaikan mesin, rem, suspensi, dan biaya perbengkelan.
          </p>
        </div>

        {session.role === 'OWNER' && <CreateMaintenanceModal trucks={trucks} />}
      </div>

      {/* Maintenance Table / Empty State */}
      {logs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Belum Ada Catatan Maintenance"
          description="Database maintenance armada saat ini masih kosong. Catat servis rutin atau perbaikan truck pertama Anda."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFAFA] text-[#6E6E73] uppercase tracking-wider font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">No. Maintenance / Tanggal</th>
                  <th className="py-3.5 px-4">Truck / Odometer</th>
                  <th className="py-3.5 px-4">Tipe Service</th>
                  <th className="py-3.5 px-4">Deskripsi / Perbaikan</th>
                  <th className="py-3.5 px-4">Bengkel</th>
                  <th className="py-3.5 px-4">Total Biaya Rp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {logs.map((m: any) => (
                  <tr key={m.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#1D1D1F] block font-mono">
                        {m.maintenanceNumber}
                      </span>
                      <span className="text-[10px] text-[#6E6E73]">{formatDate(m.date)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#1D1D1F] block">
                        {m.truck.truckCode} ({m.truck.policeNumber})
                      </span>
                      <span className="text-[10px] font-mono text-[#6E6E73]">
                        {formatKm(m.kmAtMaintenance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                        {m.maintenanceType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#1D1D1F]">
                      {m.description}
                    </td>
                    <td className="py-3.5 px-4 text-[#6E6E73]">
                      {m.workshop || 'Not recorded'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#FF3B30] font-mono">
                      {formatCurrency(m.totalCost ? Number(m.totalCost) : null)}
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
