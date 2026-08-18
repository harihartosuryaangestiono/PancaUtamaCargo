import { requireAuth } from '@/lib/session'
import { getTrucksAction } from '@/app/actions/truckActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import { Truck } from 'lucide-react'
import Link from 'next/link'

export default async function FleetReportPage() {
  await requireAuth()
  const trucks = await getTrucksAction()

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      <div>
        <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
          Matriks Komparasi Fleet Profitability
        </h2>
        <p className="text-xs text-[#6E6E73] mt-0.5">
          Analisis finansial komprehensif per armada tronton: Jarak KM, Revenue, BBM, Maintenance, Sparepart, Ban, Total Cost, Net Profit, Revenue/KM, Cost/KM, dan Profit/KM.
        </p>
      </div>

      {trucks.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Belum Ada Fleet Terdaftar"
          description="Database armada truck saat ini masih kosong. Daftarkan truck pertama untuk melihat komparasi performa operasional."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#FAFAFA] text-[#6E6E73] uppercase tracking-wider font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">Truck</th>
                  <th className="py-3.5 px-4 text-right">KM Total</th>
                  <th className="py-3.5 px-4 text-right">Revenue</th>
                  <th className="py-3.5 px-4 text-right">BBM Cost</th>
                  <th className="py-3.5 px-4 text-right">Maintenance</th>
                  <th className="py-3.5 px-4 text-right">Sparepart</th>
                  <th className="py-3.5 px-4 text-right">Tire Cost</th>
                  <th className="py-3.5 px-4 text-right">Other Cost</th>
                  <th className="py-3.5 px-4 text-right">Total Cost</th>
                  <th className="py-3.5 px-4 text-right">Net Profit</th>
                  <th className="py-3.5 px-4 text-right">Rev/KM</th>
                  <th className="py-3.5 px-4 text-right">Cost/KM</th>
                  <th className="py-3.5 px-4 text-right">Profit/KM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {trucks.map((t: any) => {
                  let revenue = 0
                  let fuelCost = 0
                  let maintCost = 0
                  let sparepartCost = 0
                  let tireCost = 0
                  let otherCost = 0

                  for (const s of t.shipments || []) {
                    if (s.revenue) revenue += Number(s.revenue)
                    if (s.fuelCost) fuelCost += Number(s.fuelCost)
                    if (s.tollCost) otherCost += Number(s.tollCost)
                    if (s.otherCost) otherCost += Number(s.otherCost)
                  }

                  for (const f of t.fuelLogs || []) {
                    if (f.totalCost && fuelCost === 0) fuelCost += Number(f.totalCost)
                  }

                  for (const m of t.maintenances || []) {
                    if (m.totalCost) maintCost += Number(m.totalCost)
                  }

                  for (const u of t.sparepartUsages || []) {
                    if (u.totalCost) sparepartCost += Number(u.totalCost)
                  }

                  const totalCost = fuelCost + maintCost + sparepartCost + tireCost + otherCost
                  const netProfit = revenue - totalCost

                  const revPerKm = t.totalKm > 0 ? revenue / t.totalKm : null
                  const costPerKm = t.totalKm > 0 ? totalCost / t.totalKm : null
                  const profitPerKm = t.totalKm > 0 ? netProfit / t.totalKm : null

                  return (
                    <tr key={t.id} className="hover:bg-[#F5F5F7] transition-colors">
                      <td className="py-3.5 px-4">
                        <Link href={`/trucks/${t.id}`} className="font-semibold text-[#1D1D1F] hover:text-[#007AFF] block">
                          {t.policeNumber}
                        </Link>
                        <span className="text-[10px] font-mono text-[#6E6E73]">{t.truckCode} · {t.brand} {t.model}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1D1D1F]">
                        {formatKm(t.totalKm)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#248A3D]">
                        {formatCurrency(revenue > 0 ? revenue : null)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">
                        {formatCurrency(fuelCost > 0 ? fuelCost : null)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">
                        {formatCurrency(maintCost > 0 ? maintCost : null)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">
                        {formatCurrency(sparepartCost > 0 ? sparepartCost : null)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">
                        {formatCurrency(tireCost > 0 ? tireCost : null)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">
                        {formatCurrency(otherCost > 0 ? otherCost : null)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#FF3B30] font-mono font-semibold">
                        {formatCurrency(totalCost > 0 ? totalCost : null)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#007AFF]">
                        {formatCurrency(netProfit !== 0 ? netProfit : null)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">
                        {revPerKm !== null ? `${formatCurrency(revPerKm)}/km` : 'Not recorded'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">
                        {costPerKm !== null ? `${formatCurrency(costPerKm)}/km` : 'Not recorded'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1D1D1F]">
                        {profitPerKm !== null ? `${formatCurrency(profitPerKm)}/km` : 'Not recorded'}
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
