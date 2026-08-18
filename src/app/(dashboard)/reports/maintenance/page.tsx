import { requireAuth } from '@/lib/session'
import { getTrucksAction } from '@/app/actions/truckActions'
import { formatCurrency } from '@/lib/utils/format'

export default async function MaintenanceReportPage() {
  await requireAuth()
  const trucks = await getTrucksAction()

  let totalMaintCount = 0
  let totalMaintCost = 0
  const categoryCosts: Record<string, number> = {
    ROUTINE_SERVICE: 0,
    REPAIR: 0,
    OIL_CHANGE: 0,
    BRAKE: 0,
    SUSPENSION: 0,
    ENGINE: 0,
    ELECTRICAL: 0,
    TIRE: 0,
    OTHER: 0,
  }

  for (const t of trucks) {
    for (const m of t.maintenances) {
      totalMaintCount++
      const cost = m.totalCost ? Number(m.totalCost) : 0
      totalMaintCost += cost
      if (categoryCosts[m.maintenanceType] !== undefined) {
        categoryCosts[m.maintenanceType] += cost
      }
    }
  }

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      <div>
        <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
          Analisis &amp; Histori Perawatan Fleet (Maintenance Intelligence)
        </h2>
        <p className="text-xs text-[#6E6E73] mt-0.5">
          Rekapitulasi biaya servis rutin, perbaikan mesin, rem, oli, dan breakdown kategori perawatan.
        </p>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-medium text-[#6E6E73]">Total Biaya Servis</span>
          <p className="text-2xl font-semibold text-[#FF9500] mt-1 font-mono">
            {formatCurrency(totalMaintCost > 0 ? totalMaintCost : null)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-medium text-[#6E6E73]">Total Kejadian Servis</span>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1">
            {totalMaintCount} Kali Servis
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-medium text-[#6E6E73]">Rata-Rata Biaya Per Servis</span>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1 font-mono">
            {formatCurrency(totalMaintCount > 0 ? totalMaintCost / totalMaintCount : null)}
          </p>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
        <h3 className="text-sm font-semibold text-[#1D1D1F]">Breakdown Biaya Berdasarkan Kategori Perawatan</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(categoryCosts).map(([type, cost]) => (
            <div key={type} className="p-3.5 rounded-xl bg-[#FAFAFA] border border-black/[0.06]">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block font-mono">
                {type.replace('_', ' ')}
              </span>
              <span className="text-sm font-semibold text-[#1D1D1F] mt-1 block font-mono">
                {formatCurrency(cost > 0 ? cost : null)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
