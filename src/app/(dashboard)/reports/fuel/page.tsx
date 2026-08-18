import { requireAuth } from '@/lib/session'
import { getTrucksAction } from '@/app/actions/truckActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import { Fuel } from 'lucide-react'

export default async function FuelReportPage() {
  await requireAuth()
  const trucks = await getTrucksAction()

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      <div>
        <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
          Analisis Efisiensi Bahan Bakar (Fuel Intelligence)
        </h2>
        <p className="text-xs text-[#6E6E73] mt-0.5">
          Konsumsi liter BBM, rasio efisiensi jarak tempuh (KM/Liter), dan total pengeluaran solar per unit truck.
        </p>
      </div>

      {trucks.length === 0 ? (
        <EmptyState
          icon={Fuel}
          title="Belum Ada Rekap Fuel Log"
          description="Database log pengisian BBM saat ini masih kosong. Catat pengisian solar pada truck untuk menghitung rasio efisiensi KM/Liter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#FAFAFA] text-[#6E6E73] uppercase tracking-wider font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">Truck &amp; Nopol</th>
                  <th className="py-3.5 px-4 text-center">Pengisian BBM</th>
                  <th className="py-3.5 px-4 text-right">Total Solar (Liter)</th>
                  <th className="py-3.5 px-4 text-right">Total Biaya Solar</th>
                  <th className="py-3.5 px-4 text-right">Total Jarak (KM)</th>
                  <th className="py-3.5 px-4 text-right">Rasio Efisiensi (KM/L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {trucks.map((t: any) => {
                  let totalLiter = 0
                  let totalCost = 0
                  for (const f of t.fuelLogs) {
                    totalLiter += f.liter
                    if (f.totalCost) totalCost += Number(f.totalCost)
                  }
                  const kmPerLiter = totalLiter > 0 && t.totalKm > 0 ? (t.totalKm / totalLiter) : null

                  return (
                    <tr key={t.id} className="hover:bg-[#F5F5F7] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1D1D1F] block">
                          {t.policeNumber}
                        </span>
                        <span className="text-[10px] font-mono text-[#6E6E73]">{t.truckCode}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[#1D1D1F]">
                        {t.fuelLogs.length} Refuel
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1D1D1F]">
                        {totalLiter > 0 ? `${totalLiter.toLocaleString()} L` : '0 L'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#FF3B30]">
                        {formatCurrency(totalCost > 0 ? totalCost : null)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#6E6E73]">
                        {formatKm(t.totalKm)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#007AFF]">
                        {kmPerLiter !== null ? `${kmPerLiter.toFixed(2)} KM/L` : 'Not enough data'}
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
