'use server'

import { requireAuth } from '@/lib/session'
import { getExecutiveDashboard, PeriodFilter } from '@/lib/reports/executiveReportService'
import { createAuditLog } from '@/lib/services/auditService'

export async function getExecutiveDashboardAction(
  period: PeriodFilter = 'THIS_MONTH',
  startDate?: string,
  endDate?: string
) {
  const session = await requireAuth()

  const data = await getExecutiveDashboard(period, startDate, endDate)

  await createAuditLog({
    action: 'EXECUTIVE_REPORT_VIEW',
    module: 'REPORTS',
    recordId: `EXEC-REPORT-${period}`,
    afterValue: { period, startDate, endDate, userId: session.userId },
  })

  return JSON.parse(JSON.stringify(data))
}

export async function exportExecutiveReportAction(
  period: PeriodFilter = 'THIS_MONTH',
  startDate?: string,
  endDate?: string
) {
  const session = await requireAuth()

  const data = await getExecutiveDashboard(period, startDate, endDate)

  await createAuditLog({
    action: 'REPORT_EXPORT',
    module: 'REPORTS',
    recordId: `EXEC-EXPORT-${period}`,
    afterValue: { period, startDate, endDate, userId: session.userId },
  })

  // Generate CSVs
  const monthlyCsvHeader = 'Month,Contracts,Distance (KM),Revenue,Fuel,Toll,Maintenance,Sparepart,Tire,Other,Total Cost,Net Profit,Profit Margin (%)\n'
  const monthlyCsvRows = data.monthlyProfitability
    .map(
      (m: any) =>
        `"${m.label}",${m.contractsCount},${m.distanceKm},${m.revenue},${m.fuelCost},${m.tollCost},${m.maintenanceCost},${m.sparepartCost},${m.tireCost},${m.otherCost},${m.totalCost},${m.netProfit},${m.profitMargin.toFixed(1)}%`
    )
    .join('\n')

  const contractCsvHeader = 'Contract Number,Customer,Truck,Driver,ERP1 Revenue,ERP2 Revenue,Total Revenue,Driver Share,Company Share,Fuel,Toll,Other Cost,Total Cost,Net Profit,Margin (%)\n'
  const contractCsvRows = data.contractProfitability
    .map(
      (c: any) =>
        `"${c.contractNumber}","${c.customerName}","${c.truckCode}","${c.driverName}",${c.erp1Revenue},${c.erp2Revenue},${c.totalRevenue},${c.driverShare},${c.companyShare},${c.fuelCost},${c.tollCost},${c.otherCost},${c.totalCost},${c.netProfit},${c.profitMargin.toFixed(1)}%`
    )
    .join('\n')

  const fleetCsvHeader = 'Rank,Truck Code,Police Number,Total KM,Contracts,Revenue,Fuel,Toll,Maintenance,Total Cost,Net Profit\n'
  const fleetCsvRows = data.fleetProfitability
    .map(
      (f: any) =>
        `${f.rank},"${f.truckCode}","${f.policeNumber}",${f.totalKm},${f.contractsCount},${f.revenue},${f.fuelCost},${f.tollCost},${f.maintenanceCost},${f.totalCost},${f.netProfit}`
    )
    .join('\n')

  return {
    success: true,
    files: {
      monthlyProfitabilityCsv: monthlyCsvHeader + monthlyCsvRows,
      contractProfitabilityCsv: contractCsvHeader + contractCsvRows,
      fleetProfitabilityCsv: fleetCsvHeader + fleetCsvRows,
    },
  }
}
