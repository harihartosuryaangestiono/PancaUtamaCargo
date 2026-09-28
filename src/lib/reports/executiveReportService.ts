import { prisma } from '@/lib/prisma'

export type PeriodFilter = 
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_3_MONTHS'
  | 'THIS_YEAR'
  | 'ALL_TIME'
  | 'CUSTOM'

export interface DateRange {
  startDate: Date | null
  endDate: Date | null
  prevStartDate: Date | null
  prevEndDate: Date | null
}

export function getDateRanges(period: PeriodFilter, customStart?: string, customEnd?: string): DateRange {
  const now = new Date()
  let startDate: Date | null = null
  let endDate: Date | null = null
  let prevStartDate: Date | null = null
  let prevEndDate: Date | null = null

  if (period === 'TODAY') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0)
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
  } else if (period === 'THIS_WEEK') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
    startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    prevEndDate = new Date(startDate.getTime() - 1)
  } else if (period === 'THIS_MONTH') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  } else if (period === 'LAST_MONTH') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999)
  } else if (period === 'LAST_3_MONTHS') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 2, 0, 23, 59, 59, 999)
  } else if (period === 'THIS_YEAR') {
    startDate = new Date(now.getFullYear(), 0, 1)
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    prevStartDate = new Date(now.getFullYear() - 1, 0, 1)
    prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
  } else if (period === 'CUSTOM' && customStart && customEnd) {
    startDate = new Date(customStart)
    endDate = new Date(customEnd)
    endDate.setHours(23, 59, 59, 999)
    const duration = endDate.getTime() - startDate.getTime()
    prevStartDate = new Date(startDate.getTime() - duration)
    prevEndDate = new Date(startDate.getTime() - 1)
  } else {
    // ALL_TIME
    startDate = null
    endDate = null
    prevStartDate = null
    prevEndDate = null
  }

  return { startDate, endDate, prevStartDate, prevEndDate }
}

export interface ExecutiveSummary {
  grossRevenue: number
  totalRevenue: number
  driverShare: number
  companyGrossShare: number
  prevRevenue: number | null
  revenueGrowthPct: number | null
  
  totalOperatingCost: number
  prevOperatingCost: number | null
  costGrowthPct: number | null
  
  costBreakdown: {
    fuel: number
    toll: number
    maintenance: number
    sparepart: number
    tire: number
    leasing?: number
    adminOffice?: number
    other: number
  }
  
  netProfit: number
  prevNetProfit: number | null
  profitGrowthPct: number | null
  
  profitMargin: number
  prevProfitMargin: number | null
  marginGrowthPts: number | null
  
  totalContracts: number
  contractsBreakdown: {
    completed: number
    inProgress: number
    planned: number
    cancelled: number
  }
  
  totalDistanceKm: number
  avgKmPerContract: number
}

export interface ProfitTrendPoint {
  monthKey: string // "2026-08" or "Aug 2026"
  label: string
  revenue: number
  cost: number
  netProfit: number
}

export interface MonthlyPerformanceRow {
  monthKey: string
  label: string
  contractsCount: number
  distanceKm: number
  grossRevenue: number
  revenue: number
  driverShare: number
  companyShare: number
  fuelCost: number
  tollCost: number
  maintenanceCost: number
  sparepartCost: number
  tireCost: number
  leasingCost: number
  adminCost: number
  otherCost: number
  totalOperatingCost: number
  totalCost: number
  netProfit: number
  profitMargin: number
  status: 'HIGH MARGIN' | 'NORMAL' | 'LOW MARGIN' | 'LOSS' | 'NO_DATA'
}

export interface ContractProfitabilityItem {
  id: string
  contractNumber: string
  customerName: string
  truckCode: string
  driverName: string
  erp1Revenue: number
  erp2Revenue: number
  totalRevenue: number
  driverShare: number
  companyShare: number
  fuelCost: number
  tollCost: number
  otherCost: number
  totalCost: number
  netProfit: number
  profitMargin: number
  status: string
  outboundRoute: string
  returnRoute: string
}

export interface FleetProfitabilityItem {
  rank: number
  truckId: string
  truckCode: string
  policeNumber: string
  totalKm: number
  contractsCount: number
  revenue: number
  fuelCost: number
  tollCost: number
  maintenanceCost: number
  sparepartCost: number
  tireCost: number
  otherCost: number
  totalCost: number
  netProfit: number
  revPerKm: number | null
  costPerKm: number | null
  profitPerKm: number | null
  badge?: '🏆 Most Profitable' | '💸 Highest Operating Cost' | '⚠ Lowest Margin' | '⛽ Highest Fuel Cost/KM'
}

export interface DriverPerformanceItem {
  driverId: string
  driverName: string
  contractsCount: number
  distanceKm: number
  revenue: number
  driverAllocation: number
  avgRevPerKm: number | null
  advanceGiven: number
  settlementPaid: number
  driverRefund: number
  outstandingBalance: number
  status: 'SETTLED' | 'PARTIALLY_SETTLED' | 'OVERPAID' | 'PENDING'
}

export interface CustomerProfitabilityItem {
  customerId: string
  customerName: string
  contractsCount: number
  distanceKm: number
  revenue: number
  totalCost: number
  netProfit: number
  profitMargin: number
  revPerKm: number | null
}

export interface FuelIntelligenceSummary {
  totalLiters: number
  totalFuelCost: number
  totalKm: number
  avgKmLiter: number | null
  avgCostPerKm: number | null
  monthlyFuelTrend: { label: string; fuelCost: number; liters: number }[]
  truckFuelRankings: {
    truckCode: string
    policeNumber: string
    km: number
    liters: number
    kmPerLiter: number | null
    fuelCost: number
    costPerKm: number | null
    flag: 'EXCELLENT' | 'NORMAL' | 'UNUSUAL' | 'CRITICAL' | 'NOT ENOUGH DATA'
  }[]
}

export interface MaintenanceIntelligenceSummary {
  totalMaintenanceCost: number
  serviceCount: number
  avgCostPerService: number | null
  categoryBreakdown: { category: string; cost: number; count: number }[]
  overdueSchedulesCount: number
  mostExpensiveTruckMaintenance: { truckCode: string; cost: number; serviceCount: number }[]
}

export interface TireIntelligenceSummary {
  totalPurchaseCost: number
  activeTiresCount: number
  replacementDueCount: number
  avgTireCostPerKm: number | null
  tiresNearReplacement: { id: string; tireCode: string; brand: string; currentKm: number; lifetimeKm: number; status: string }[]
}

export interface DriverCashFlowSummary {
  totalAdvanceGiven: number
  totalSettlementPaid: number
  totalDriverRefund: number
  totalOffsetNextTrip: number
  outstandingDriverBalance: number
}

export interface MonthlyPnLStatement {
  monthKey: string
  periodLabel: string
  revenue: {
    grossContractValue: number
    taxDeduction: number
    netContractValue: number
    otherIncome: number
    totalNetRevenue: number
  }
  directTripCosts: {
    driverShare: number
    companyToll: number
    driverToll: number
    totalToll: number
    fuelCost: number
    otherTripCost: number
    totalDirectTripCosts: number
  }
  grossProfit: number
  grossProfitMargin: number
  operatingExpenses: {
    maintenance: number
    tires: number
    spareparts: number
    truckLeasing: number
    bankAndAdmin: number
    officeAndOther: number
    totalOperatingExpenses: number
    breakdownItems: Array<{
      date: string
      category: string
      description: string
      amount: number
    }>
  }
  netOperatingProfit: number
  netProfitMargin: number
  contractsCount: number
  completedContractsCount: number
  totalDistanceKm: number
  customerPaymentsReceived: number
  outstandingReceivables: number
}

export interface AvailableMonthOption {
  monthKey: string
  label: string
  contractsCount: number
  grossRevenue: number
  netProfit: number
  hasData: boolean
}

export interface ExecutiveFinancialReport {
  summary: ExecutiveSummary
  profitTrend: ProfitTrendPoint[]
  monthlyProfitability: MonthlyPerformanceRow[]
  contractProfitability: ContractProfitabilityItem[]
  fleetProfitability: FleetProfitabilityItem[]
  driverPerformance: DriverPerformanceItem[]
  customerProfitability: CustomerProfitabilityItem[]
  driverCashFlow: DriverCashFlowSummary
  fuelIntelligence: FuelIntelligenceSummary
  maintenanceIntelligence: MaintenanceIntelligenceSummary
  tireIntelligence: TireIntelligenceSummary
  monthlyPnLStatement: MonthlyPnLStatement
  availableMonths: AvailableMonthOption[]
  insights: string[]
}

export function classifyExpense(catName?: string | null, desc?: string | null) {
  const cat = (catName || '').toLowerCase()
  const d = (desc || '').toLowerCase()

  if (cat.includes('maintenance') || /service|maintenance|ganti filter|kelistrikan|bengkel/i.test(d)) {
    return 'maintenance'
  }
  if (cat.includes('ban') || /\bban\b|pecah ban|vulkanisir/i.test(d)) {
    return 'tires'
  }
  if (cat.includes('sparepart') || /sparepart|onderdil/i.test(d)) {
    return 'spareparts'
  }
  if (/dipostar|leasing|angsuran truk/i.test(d)) {
    return 'truckLeasing'
  }
  if (/bi-fast|atm|biaya txn|tarikan pemindahan|administrasi/i.test(d)) {
    return 'bankAndAdmin'
  }
  if (cat.includes('bahan bakar') || /spbu|solar|bbm/i.test(d)) {
    return 'fuel'
  }
  if (cat.includes('tol') || /flazz|e-toll/i.test(d)) {
    return 'toll'
  }
  return 'officeAndOther'
}

export async function getExecutiveDashboard(
  period: PeriodFilter = 'THIS_MONTH',
  customStart?: string,
  customEnd?: string,
  targetMonthKey?: string
): Promise<ExecutiveFinancialReport> {
  const ranges = getDateRanges(period, customStart, customEnd)

  // 1. Where filters
  const contractWhere: any = {}
  const prevContractWhere: any = {}
  const fuelWhere: any = {}
  const maintWhere: any = {}
  const finWhere: any = {}

  if (ranges.startDate && ranges.endDate) {
    contractWhere.OR = [
      { startDate: { gte: ranges.startDate, lte: ranges.endDate } },
      { createdAt: { gte: ranges.startDate, lte: ranges.endDate } },
    ]
    fuelWhere.date = { gte: ranges.startDate, lte: ranges.endDate }
    maintWhere.date = { gte: ranges.startDate, lte: ranges.endDate }
    finWhere.date = { gte: ranges.startDate, lte: ranges.endDate }
  }

  if (ranges.prevStartDate && ranges.prevEndDate) {
    prevContractWhere.OR = [
      { startDate: { gte: ranges.prevStartDate, lte: ranges.prevEndDate } },
      { createdAt: { gte: ranges.prevStartDate, lte: ranges.prevEndDate } },
    ]
  }

  // Fetch contracts for current period
  const contracts = await prisma.tripContract.findMany({
    where: contractWhere,
    include: {
      truck: true,
      customer: true,
      driver: true,
      legs: true,
      advances: true,
      settlements: true,
    },
    orderBy: { startDate: 'desc' },
  })

  // Fetch contracts for previous period
  const prevContracts = await prisma.tripContract.findMany({
    where: prevContractWhere,
    include: { legs: true },
  })

  // Financial transactions for expenses
  const finTransactions = await prisma.financialTransaction.findMany({
    where: finWhere,
    include: { expenseCategory: true, incomeCategory: true },
    orderBy: { date: 'desc' },
  })

  // Fuel logs
  const fuelLogs = await prisma.fuelLog.findMany({
    where: fuelWhere,
    include: { truck: true },
  })

  // Maintenance records
  const maintenanceRecords = await prisma.maintenance.findMany({
    where: maintWhere,
    include: { truck: true, sparepartUsages: true },
  })

  // Spareparts & Tires
  const tires = await prisma.tire.findMany()
  const spareparts = await prisma.sparepart.findMany()

  // ----------------------------------------------------
  // CALCULATIONS FOR CURRENT PERIOD
  // ----------------------------------------------------
  let totalGrossRevenue = 0
  let totalFuelCost = 0
  let totalTollCost = 0
  let totalOtherCost = 0
  let totalDistanceKm = 0
  let totalCompanyToll = 0

  contracts.forEach((c) => {
    if (c.status === 'CANCELLED') return
    c.legs.forEach((leg) => {
      const v = Number(leg.contractValue || 0)
      const t = Number(leg.tollCost || 0)
      const ct = Number(leg.companyTollCost || t * 0.6)
      const f = Number(leg.fuelCost || 0)
      const o = Number(leg.otherCost || 0)
      totalGrossRevenue += v
      totalTollCost += t
      totalCompanyToll += ct
      totalFuelCost += f
      totalOtherCost += o
      totalDistanceKm += leg.distanceKm || 0
    })
  })

  // 98% Net Received by company from contracts
  const netContractValueTotal = totalGrossRevenue * 0.98

  // 53% Driver Share (Hak Supir)
  const driverShare = totalGrossRevenue * 0.53

  // Classify expenses from finTransactions
  let finFuelCost = 0
  let finTollCost = 0
  let maintenanceCostTotal = maintenanceRecords.reduce((sum, m) => sum + Number(m.totalCost || 0), 0)
  let sparepartCostTotal = 0
  let tireCostTotal = 0
  let leasingCostTotal = 0
  let adminOfficeCostTotal = 0
  let finOtherCostTotal = 0
  let otherIncomeTotal = 0

  finTransactions.forEach((f) => {
    const amt = Number(f.amount || 0)
    if (f.type === 'INCOME') {
      const cat = (f.incomeCategory?.name || '').toLowerCase()
      if (!f.contractId && cat !== 'hasil pengiriman') {
        otherIncomeTotal += amt
      }
    } else {
      const classified = classifyExpense(f.expenseCategory?.name, f.description)
      if (classified === 'maintenance') maintenanceCostTotal += amt
      else if (classified === 'tires') tireCostTotal += amt
      else if (classified === 'spareparts') sparepartCostTotal += amt
      else if (classified === 'truckLeasing') leasingCostTotal += amt
      else if (classified === 'bankAndAdmin') adminOfficeCostTotal += amt
      else if (classified === 'fuel') finFuelCost += amt
      else if (classified === 'toll') finTollCost += amt
      else finOtherCostTotal += amt
    }
  })

  const fuelLogCostTotal = fuelLogs.reduce((sum, f) => sum + Number(f.totalCost || 0), 0)
  const actualFuelCost = Math.max(totalFuelCost + finFuelCost, fuelLogCostTotal)
  const actualTollCost = totalCompanyToll + finTollCost
  const totalOtherExpenses = totalOtherCost + finOtherCostTotal

  const totalOperatingCost =
    actualFuelCost +
    actualTollCost +
    maintenanceCostTotal +
    sparepartCostTotal +
    tireCostTotal +
    leasingCostTotal +
    adminOfficeCostTotal +
    totalOtherExpenses

  const totalRevenue = netContractValueTotal + otherIncomeTotal
  const companyGrossShare = totalGrossRevenue * 0.47 + otherIncomeTotal

  // NET COMPANY PROFIT = Total Net Revenue - Driver Share - Total Operating Expenses
  const netProfit = totalRevenue - driverShare - totalOperatingCost
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // ----------------------------------------------------
  // CALCULATIONS FOR PREVIOUS PERIOD
  // ----------------------------------------------------
  let prevGrossRevenue = 0
  let prevTotalCost = 0
  prevContracts.forEach((c) => {
    if (c.status === 'CANCELLED') return
    c.legs.forEach((leg) => {
      prevGrossRevenue += Number(leg.contractValue || 0)
      prevTotalCost += Number(leg.tollCost || 0) + Number(leg.fuelCost || 0) + Number(leg.otherCost || 0)
    })
  })
  const prevRevenue = ranges.prevStartDate ? prevGrossRevenue * 0.98 : null
  const prevCompanyShare = prevRevenue !== null ? prevRevenue * 0.47 : null
  const prevOperatingCost = ranges.prevStartDate ? prevTotalCost : null
  const prevNetProfit = prevCompanyShare !== null && prevOperatingCost !== null ? prevCompanyShare - prevOperatingCost : null
  const prevProfitMargin = prevRevenue && prevRevenue > 0 && prevNetProfit !== null ? (prevNetProfit / prevRevenue) * 100 : null

  const revenueGrowthPct = prevRevenue && prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null
  const costGrowthPct = prevOperatingCost && prevOperatingCost > 0 ? ((totalOperatingCost - prevOperatingCost) / prevOperatingCost) * 100 : null
  const profitGrowthPct = prevNetProfit && prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : null
  const marginGrowthPts = prevProfitMargin !== null ? profitMargin - prevProfitMargin : null

  // Contract counts breakdown
  const contractsBreakdown = {
    completed: contracts.filter((c) => c.status === 'COMPLETED').length,
    inProgress: contracts.filter((c) => c.status === 'IN_PROGRESS').length,
    planned: contracts.filter((c) => c.status === 'PLANNED').length,
    cancelled: contracts.filter((c) => c.status === 'CANCELLED').length,
  }

  const validContractsCount = contracts.filter((c) => c.status !== 'CANCELLED').length
  const avgKmPerContract = validContractsCount > 0 ? totalDistanceKm / validContractsCount : 0

  const summary: ExecutiveSummary = {
    grossRevenue: totalGrossRevenue,
    totalRevenue,
    driverShare,
    companyGrossShare,
    prevRevenue,
    revenueGrowthPct,
    totalOperatingCost,
    prevOperatingCost,
    costGrowthPct,
    costBreakdown: {
      fuel: actualFuelCost,
      toll: actualTollCost,
      maintenance: maintenanceCostTotal,
      sparepart: sparepartCostTotal,
      tire: tireCostTotal,
      leasing: leasingCostTotal,
      adminOffice: adminOfficeCostTotal,
      other: totalOtherExpenses,
    },
    netProfit,
    prevNetProfit,
    profitGrowthPct,
    profitMargin,
    prevProfitMargin,
    marginGrowthPts,
    totalContracts: contracts.length,
    contractsBreakdown,
    totalDistanceKm,
    avgKmPerContract,
  }

  // ----------------------------------------------------
  // FULL YEAR CONSOLIDATION FOR 12-MONTH TABLE & PnL STATEMENT
  // ----------------------------------------------------
  const allYearContracts = await prisma.tripContract.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: { legs: true, advances: true, settlements: true, customer: true, truck: true, driver: true },
    orderBy: { startDate: 'desc' },
  })

  const allYearFinTrx = await prisma.financialTransaction.findMany({
    include: { expenseCategory: true, incomeCategory: true },
    orderBy: { date: 'desc' },
  })

  const allYearMaintenances = await prisma.maintenance.findMany({
    include: { truck: true },
    orderBy: { date: 'desc' },
  })

  const monthMap = new Map<string, MonthlyPerformanceRow>()
  const year = new Date().getFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const fullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  for (let m = 0; m < 12; m++) {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`
    const label = `${monthNames[m]} ${year}`
    monthMap.set(key, {
      monthKey: key,
      label,
      contractsCount: 0,
      distanceKm: 0,
      grossRevenue: 0,
      revenue: 0,
      driverShare: 0,
      companyShare: 0,
      fuelCost: 0,
      tollCost: 0,
      maintenanceCost: 0,
      sparepartCost: 0,
      tireCost: 0,
      leasingCost: 0,
      adminCost: 0,
      otherCost: 0,
      totalOperatingCost: 0,
      totalCost: 0,
      netProfit: 0,
      profitMargin: 0,
      status: 'NO_DATA',
    })
  }

  // 1. Accumulate ALL contracts across the full year
  allYearContracts.forEach((c) => {
    const d = new Date(c.startDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        monthKey: key,
        label: `${monthNames[d.getMonth()] || 'M'} ${d.getFullYear()}`,
        contractsCount: 0,
        distanceKm: 0,
        grossRevenue: 0,
        revenue: 0,
        driverShare: 0,
        companyShare: 0,
        fuelCost: 0,
        tollCost: 0,
        maintenanceCost: 0,
        sparepartCost: 0,
        tireCost: 0,
        leasingCost: 0,
        adminCost: 0,
        otherCost: 0,
        totalOperatingCost: 0,
        totalCost: 0,
        netProfit: 0,
        profitMargin: 0,
        status: 'NO_DATA',
      })
    }

    const row = monthMap.get(key)!
    row.contractsCount += 1

    c.legs.forEach((leg) => {
      const gross = Number(leg.contractValue || 0)
      const rev = gross * 0.98
      const dShare = gross * ((leg.driverPercentage || 53) / 100)
      const cShare = gross * 0.47
      const fuel = Number(leg.fuelCost || 0)
      const toll = Number(leg.companyTollCost || Number(leg.tollCost || 0) * 0.6)
      const other = Number(leg.otherCost || 0)

      row.grossRevenue += gross
      row.revenue += rev
      row.driverShare += dShare
      row.companyShare += cShare
      row.distanceKm += leg.distanceKm || 0
      row.fuelCost += fuel
      row.tollCost += toll
      row.otherCost += other
    })
  })

  // 2. Accumulate ALL financial transactions across the full year
  allYearFinTrx.forEach((f) => {
    const d = new Date(f.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) return
    const row = monthMap.get(key)!
    const amt = Number(f.amount || 0)

    if (f.type === 'INCOME') {
      const cat = (f.incomeCategory?.name || '').toLowerCase()
      if (!f.contractId && cat !== 'hasil pengiriman') {
        row.revenue += amt
        row.companyShare += amt
      }
    } else {
      const classified = classifyExpense(f.expenseCategory?.name, f.description)
      if (classified === 'maintenance') row.maintenanceCost += amt
      else if (classified === 'tires') row.tireCost += amt
      else if (classified === 'spareparts') row.sparepartCost += amt
      else if (classified === 'truckLeasing') row.leasingCost += amt
      else if (classified === 'bankAndAdmin') row.adminCost += amt
      else if (classified === 'fuel') row.fuelCost += amt
      else if (classified === 'toll') row.tollCost += amt
      else row.otherCost += amt
    }
  })

  // 3. Accumulate unlinked maintenance
  allYearMaintenances.forEach((m) => {
    const d = new Date(m.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) return
    const row = monthMap.get(key)!
    // If not already in finTransactions
    const hasFin = allYearFinTrx.some((f) => f.maintenanceId === m.id)
    if (!hasFin) {
      row.maintenanceCost += Number(m.totalCost || 0)
    }
  })

  // Calculate monthly net profit and margin
  const monthlyProfitability: MonthlyPerformanceRow[] = Array.from(monthMap.values()).map((row) => {
    row.totalOperatingCost =
      row.fuelCost +
      row.tollCost +
      row.maintenanceCost +
      row.sparepartCost +
      row.tireCost +
      row.leasingCost +
      row.adminCost +
      row.otherCost

    row.totalCost = row.driverShare + row.totalOperatingCost
    row.netProfit = row.revenue - row.driverShare - row.totalOperatingCost
    row.profitMargin = row.revenue > 0 ? (row.netProfit / row.revenue) * 100 : 0

    if (row.contractsCount === 0 && row.totalOperatingCost === 0) {
      row.status = 'NO_DATA'
    } else if (row.netProfit < 0) {
      row.status = 'LOSS'
    } else if (row.profitMargin >= 30) {
      row.status = 'HIGH MARGIN'
    } else if (row.profitMargin >= 10) {
      row.status = 'NORMAL'
    } else {
      row.status = 'LOW MARGIN'
    }
    return row
  })

  const profitTrend: ProfitTrendPoint[] = monthlyProfitability
    .filter((m) => m.contractsCount > 0 || m.totalOperatingCost > 0 || m.monthKey.endsWith('-08') || m.monthKey.endsWith('-09'))
    .map((m) => ({
      monthKey: m.monthKey,
      label: m.label,
      revenue: m.revenue,
      cost: m.totalCost,
      netProfit: m.netProfit,
    }))

  // ----------------------------------------------------
  // COMPREHENSIVE MONTHLY P&L STATEMENT GENERATOR
  // ----------------------------------------------------
  // Determine target month for statement (default to targetMonthKey or current period month)
  const currentNow = new Date()
  let selectedMonthKey = targetMonthKey
  if (!selectedMonthKey) {
    if (ranges.startDate) {
      selectedMonthKey = `${ranges.startDate.getFullYear()}-${String(ranges.startDate.getMonth() + 1).padStart(2, '0')}`
    } else {
      selectedMonthKey = `${currentNow.getFullYear()}-${String(currentNow.getMonth() + 1).padStart(2, '0')}`
    }
  }

  const [selYear, selMonth] = selectedMonthKey.split('-').map(Number)
  const selMonthIdx = selMonth - 1
  const periodLabel = `${fullMonthNames[selMonthIdx] || 'Bulan'} ${selYear}`

  const targetMonthContracts = allYearContracts.filter(
    (c) => c.startDate.toISOString().slice(0, 7) === selectedMonthKey
  )
  const targetMonthFin = allYearFinTrx.filter(
    (f) => f.date.toISOString().slice(0, 7) === selectedMonthKey
  )

  let stGrossContractValue = 0
  let stDriverShare = 0
  let stCompanyToll = 0
  let stDriverToll = 0
  let stTotalToll = 0
  let stFuelCost = 0
  let stOtherTripCost = 0
  let stDistanceKm = 0
  let stCustomerPaymentsReceived = 0

  targetMonthContracts.forEach((c) => {
    stCustomerPaymentsReceived += Number(c.paidAmount || 0)
    c.legs.forEach((leg) => {
      const v = Number(leg.contractValue || 0)
      const t = Number(leg.tollCost || 0)
      const ct = Number(leg.companyTollCost || t * 0.6)
      const dt = Number(leg.driverTollCost || t * 0.4)
      const f = Number(leg.fuelCost || 0)
      const o = Number(leg.otherCost || 0)

      stGrossContractValue += v
      stDriverShare += v * ((leg.driverPercentage || 53) / 100)
      stTotalToll += t
      stCompanyToll += ct
      stDriverToll += dt
      stFuelCost += f
      stOtherTripCost += o
      stDistanceKm += leg.distanceKm || 0
    })
  })

  const stTaxDeduction = stGrossContractValue * 0.02
  const stNetContractValue = stGrossContractValue * 0.98

  let stOtherIncome = 0
  let stMaintenance = 0
  let stTires = 0
  let stSpareparts = 0
  let stTruckLeasing = 0
  let stBankAndAdmin = 0
  let stOfficeAndOther = 0
  const breakdownItems: { date: string; category: string; description: string; amount: number }[] = []

  targetMonthFin.forEach((f) => {
    const amt = Number(f.amount || 0)
    if (f.type === 'INCOME') {
      const cat = (f.incomeCategory?.name || '').toLowerCase()
      if (!f.contractId && cat !== 'hasil pengiriman') {
        stOtherIncome += amt
      }
    } else {
      const classified = classifyExpense(f.expenseCategory?.name, f.description)
      breakdownItems.push({
        date: f.date.toISOString().slice(0, 10),
        category:
          classified === 'truckLeasing'
            ? 'Cicilan / Leasing Truk'
            : classified === 'tires'
            ? 'Ban Armada'
            : classified === 'maintenance'
            ? 'Maintenance & Bengkel'
            : classified === 'spareparts'
            ? 'Sparepart'
            : classified === 'bankAndAdmin'
            ? 'Administrasi Bank & Kas'
            : classified === 'fuel'
            ? 'BBM Solar'
            : classified === 'toll'
            ? 'Tol Armada'
            : 'Operasional Lainnya',
        description: f.description,
        amount: amt,
      })

      if (classified === 'maintenance') stMaintenance += amt
      else if (classified === 'tires') stTires += amt
      else if (classified === 'spareparts') stSpareparts += amt
      else if (classified === 'truckLeasing') stTruckLeasing += amt
      else if (classified === 'bankAndAdmin') stBankAndAdmin += amt
      else if (classified === 'fuel') stFuelCost += amt
      else if (classified === 'toll') stCompanyToll += amt
      else stOfficeAndOther += amt
    }
  })

  const stTotalDirectTripCosts = stDriverShare + stCompanyToll + stFuelCost + stOtherTripCost
  const stGrossProfit = stNetContractValue - stTotalDirectTripCosts
  const stGrossProfitMargin = stNetContractValue > 0 ? (stGrossProfit / stNetContractValue) * 100 : 0

  const stTotalOperatingExpenses =
    stMaintenance + stTires + stSpareparts + stTruckLeasing + stBankAndAdmin + stOfficeAndOther
  const stTotalNetRevenue = stNetContractValue + stOtherIncome
  const stNetOperatingProfit = stGrossProfit + stOtherIncome - stTotalOperatingExpenses
  const stNetProfitMargin = stTotalNetRevenue > 0 ? (stNetOperatingProfit / stTotalNetRevenue) * 100 : 0

  const monthlyPnLStatement: MonthlyPnLStatement = {
    monthKey: selectedMonthKey,
    periodLabel,
    revenue: {
      grossContractValue: stGrossContractValue,
      taxDeduction: stTaxDeduction,
      netContractValue: stNetContractValue,
      otherIncome: stOtherIncome,
      totalNetRevenue: stTotalNetRevenue,
    },
    directTripCosts: {
      driverShare: stDriverShare,
      companyToll: stCompanyToll,
      driverToll: stDriverToll,
      totalToll: stTotalToll,
      fuelCost: stFuelCost,
      otherTripCost: stOtherTripCost,
      totalDirectTripCosts: stTotalDirectTripCosts,
    },
    grossProfit: stGrossProfit,
    grossProfitMargin: stGrossProfitMargin,
    operatingExpenses: {
      maintenance: stMaintenance,
      tires: stTires,
      spareparts: stSpareparts,
      truckLeasing: stTruckLeasing,
      bankAndAdmin: stBankAndAdmin,
      officeAndOther: stOfficeAndOther,
      totalOperatingExpenses: stTotalOperatingExpenses,
      breakdownItems,
    },
    netOperatingProfit: stNetOperatingProfit,
    netProfitMargin: stNetProfitMargin,
    contractsCount: targetMonthContracts.length,
    completedContractsCount: targetMonthContracts.filter((c) => c.status === 'COMPLETED').length,
    totalDistanceKm: stDistanceKm,
    customerPaymentsReceived: stCustomerPaymentsReceived,
    outstandingReceivables: Math.max(0, stGrossContractValue - stCustomerPaymentsReceived),
  }

  // Available months list for picker
  const availableMonths: AvailableMonthOption[] = Array.from(monthMap.values())
    .map((row) => ({
      monthKey: row.monthKey,
      label: row.label,
      contractsCount: row.contractsCount,
      grossRevenue: row.grossRevenue,
      netProfit: row.netProfit,
      hasData: row.contractsCount > 0 || row.totalOperatingCost > 0,
    }))
    .reverse()

  // ----------------------------------------------------
  // CONTRACT PROFITABILITY & ROUND-TRIP INTELLIGENCE
  // ----------------------------------------------------
  const contractProfitability: ContractProfitabilityItem[] = contracts
    .filter((c) => c.status !== 'CANCELLED')
    .map((c) => {
      const leg1 = c.legs.find((l) => l.legNumber === 1) || c.legs[0]
      const leg2 = c.legs.find((l) => l.legNumber === 2) || c.legs[1]

      const erp1Rev = leg1 ? Number(leg1.contractValue || 0) : 0
      const erp2Rev = leg2 ? Number(leg2.contractValue || 0) : 0
      const grossRev = erp1Rev + erp2Rev
      const totalRev = grossRev * 0.98

      // Driver allocation is 53% of net revenue
      const driverShare = totalRev * 0.53
      const companyShare = totalRev * 0.47

      const fuel = c.legs.reduce((s, l) => s + Number(l.fuelCost || 0), 0)
      const toll = c.legs.reduce((s, l) => s + Number(l.tollCost || 0), 0)
      const other = c.legs.reduce((s, l) => s + Number(l.otherCost || 0), 0)
      const totalCost = fuel + toll + other

      const netProf = companyShare - totalCost
      const margin = totalRev > 0 ? (netProf / totalRev) * 100 : 0

      const outboundRoute = leg1 ? `${leg1.origin} → ${leg1.destination}` : 'N/A'
      const returnRoute = leg2 ? `${leg2.origin} → ${leg2.destination}` : 'N/A'

      return {
        id: c.id,
        contractNumber: c.contractNumber,
        customerName: c.customer?.name || 'N/A',
        truckCode: c.truck?.truckCode || 'N/A',
        driverName: c.driverName || c.driver?.name || 'N/A',
        erp1Revenue: erp1Rev,
        erp2Revenue: erp2Rev,
        totalRevenue: totalRev,
        driverShare,
        companyShare,
        fuelCost: fuel,
        tollCost: toll,
        otherCost: other,
        totalCost,
        netProfit: netProf,
        profitMargin: margin,
        status: c.status,
        outboundRoute,
        returnRoute,
      }
    })
    .sort((a, b) => b.netProfit - a.netProfit)

  // ----------------------------------------------------
  // FLEET PROFITABILITY
  // ----------------------------------------------------
  const trucks = await prisma.truck.findMany()
  const fleetProfitabilityMap = new Map<string, FleetProfitabilityItem>()

  trucks.forEach((t) => {
    fleetProfitabilityMap.set(t.id, {
      rank: 0,
      truckId: t.id,
      truckCode: t.truckCode,
      policeNumber: t.policeNumber,
      totalKm: t.totalKm,
      contractsCount: 0,
      revenue: 0,
      fuelCost: 0,
      tollCost: 0,
      maintenanceCost: 0,
      sparepartCost: 0,
      tireCost: 0,
      otherCost: 0,
      totalCost: 0,
      netProfit: 0,
      revPerKm: null,
      costPerKm: null,
      profitPerKm: null,
    })
  })

  contracts.forEach((c) => {
    if (c.status === 'CANCELLED' || !c.truckId) return
    const item = fleetProfitabilityMap.get(c.truckId)
    if (!item) return

    item.contractsCount += 1
    c.legs.forEach((leg) => {
      const gross = Number(leg.contractValue || 0)
      const rev = gross * 0.98
      const fuel = Number(leg.fuelCost || 0)
      const toll = Number(leg.tollCost || 0)
      const other = Number(leg.otherCost || 0)

      item.revenue += rev
      item.fuelCost += fuel
      item.tollCost += toll
      item.otherCost += other
      item.totalCost += (fuel + toll + other)
    })
  })

  // Add maintenance & tire cost to truck
  maintenanceRecords.forEach((m) => {
    if (!m.truckId) return
    const item = fleetProfitabilityMap.get(m.truckId)
    if (item) {
      item.maintenanceCost += Number(m.totalCost || 0)
      item.totalCost += Number(m.totalCost || 0)
    }
  })

  const fleetProfitabilityList: FleetProfitabilityItem[] = Array.from(fleetProfitabilityMap.values()).map((item) => {
    item.netProfit = item.revenue - item.totalCost
    if (item.totalKm > 0) {
      item.revPerKm = item.revenue / item.totalKm
      item.costPerKm = item.totalCost / item.totalKm
      item.profitPerKm = item.netProfit / item.totalKm
    }
    return item
  }).sort((a, b) => b.netProfit - a.netProfit)

  fleetProfitabilityList.forEach((item, index) => {
    item.rank = index + 1
  })

  if (fleetProfitabilityList.length > 0) {
    fleetProfitabilityList[0].badge = '🏆 Most Profitable'
    const highestCost = [...fleetProfitabilityList].sort((a, b) => b.totalCost - a.totalCost)[0]
    if (highestCost && highestCost.totalCost > 0) highestCost.badge = '💸 Highest Operating Cost'
  }

  // ----------------------------------------------------
  // DRIVER PERFORMANCE & CASH FLOW
  // ----------------------------------------------------
  const drivers = await prisma.driver.findMany()
  const driverMap = new Map<string, DriverPerformanceItem>()

  drivers.forEach((d) => {
    driverMap.set(d.id, {
      driverId: d.id,
      driverName: d.name,
      contractsCount: 0,
      distanceKm: 0,
      revenue: 0,
      driverAllocation: 0,
      avgRevPerKm: null,
      advanceGiven: 0,
      settlementPaid: 0,
      driverRefund: 0,
      outstandingBalance: 0,
      status: 'SETTLED',
    })
  })

  contracts.forEach((c) => {
    if (c.status === 'CANCELLED' || !c.driverId) return
    let dItem = driverMap.get(c.driverId)
    if (!dItem) {
      dItem = {
        driverId: c.driverId,
        driverName: c.driverName || 'Driver',
        contractsCount: 0,
        distanceKm: 0,
        revenue: 0,
        driverAllocation: 0,
        avgRevPerKm: null,
        advanceGiven: 0,
        settlementPaid: 0,
        driverRefund: 0,
        outstandingBalance: 0,
        status: 'SETTLED',
      }
      driverMap.set(c.driverId, dItem)
    }

    dItem.contractsCount += 1
    c.legs.forEach((leg) => {
      const gross = Number(leg.contractValue || 0)
      const rev = gross * 0.98
      dItem!.revenue += rev
      dItem!.distanceKm += leg.distanceKm || 0
    })

    dItem.driverAllocation = dItem.revenue * 0.53

    c.advances.forEach((adv) => {
      dItem!.advanceGiven += Number(adv.amount || 0)
    })

    c.settlements.forEach((s) => {
      dItem!.settlementPaid += Number(s.amountAlreadyPaid || s.finalDriverAmount || 0)
      dItem!.driverRefund += Number(s.settlementDifference && Number(s.settlementDifference) < 0 ? Math.abs(Number(s.settlementDifference)) : 0)
    })
  })

  const driverPerformanceList: DriverPerformanceItem[] = Array.from(driverMap.values()).map((d) => {
    if (d.distanceKm > 0) d.avgRevPerKm = d.revenue / d.distanceKm
    d.outstandingBalance = d.driverAllocation - d.advanceGiven - d.settlementPaid + d.driverRefund
    if (d.outstandingBalance === 0) d.status = 'SETTLED'
    else if (d.outstandingBalance > 0) d.status = 'PARTIALLY_SETTLED'
    else d.status = 'OVERPAID'
    return d
  }).sort((a, b) => b.revenue - a.revenue)

  const driverCashFlow: DriverCashFlowSummary = {
    totalAdvanceGiven: driverPerformanceList.reduce((s, d) => s + d.advanceGiven, 0),
    totalSettlementPaid: driverPerformanceList.reduce((s, d) => s + d.settlementPaid, 0),
    totalDriverRefund: driverPerformanceList.reduce((s, d) => s + d.driverRefund, 0),
    totalOffsetNextTrip: 0,
    outstandingDriverBalance: driverPerformanceList.reduce((s, d) => s + d.outstandingBalance, 0),
  }

  // ----------------------------------------------------
  // CUSTOMER PROFITABILITY
  // ----------------------------------------------------
  const customers = await prisma.customer.findMany()
  const customerMap = new Map<string, CustomerProfitabilityItem>()

  customers.forEach((cust) => {
    customerMap.set(cust.id, {
      customerId: cust.id,
      customerName: cust.name,
      contractsCount: 0,
      distanceKm: 0,
      revenue: 0,
      totalCost: 0,
      netProfit: 0,
      profitMargin: 0,
      revPerKm: null,
    })
  })

  contracts.forEach((c) => {
    if (c.status === 'CANCELLED' || !c.customerId) return
    let custItem = customerMap.get(c.customerId)
    if (!custItem) {
      custItem = {
        customerId: c.customerId,
        customerName: c.customer?.name || 'Customer',
        contractsCount: 0,
        distanceKm: 0,
        revenue: 0,
        totalCost: 0,
        netProfit: 0,
        profitMargin: 0,
        revPerKm: null,
      }
      customerMap.set(c.customerId, custItem)
    }

    custItem.contractsCount += 1
    c.legs.forEach((leg) => {
      const gross = Number(leg.contractValue || 0)
      const rev = gross * 0.98
      const fuel = Number(leg.fuelCost || 0)
      const toll = Number(leg.tollCost || 0)
      const other = Number(leg.otherCost || 0)

      custItem!.revenue += rev
      custItem!.distanceKm += leg.distanceKm || 0
      custItem!.totalCost += (fuel + toll + other)
    })
  })

  const customerProfitabilityList: CustomerProfitabilityItem[] = Array.from(customerMap.values()).map((cust) => {
    cust.netProfit = cust.revenue - cust.totalCost
    cust.profitMargin = cust.revenue > 0 ? (cust.netProfit / cust.revenue) * 100 : 0
    if (cust.distanceKm > 0) cust.revPerKm = cust.revenue / cust.distanceKm
    return cust
  }).sort((a, b) => b.revenue - a.revenue)

  // ----------------------------------------------------
  // FUEL, MAINTENANCE & TIRE INTELLIGENCE
  // ----------------------------------------------------
  const totalFuelLiters = fuelLogs.reduce((s, f) => s + Number(f.liter || 0), 0)
  const avgKmLiter = totalFuelLiters > 0 ? totalDistanceKm / totalFuelLiters : null
  const avgFuelCostPerKm = totalDistanceKm > 0 ? actualFuelCost / totalDistanceKm : null

  const fuelIntelligence: FuelIntelligenceSummary = {
    totalLiters: totalFuelLiters,
    totalFuelCost: actualFuelCost,
    totalKm: totalDistanceKm,
    avgKmLiter,
    avgCostPerKm: avgFuelCostPerKm,
    monthlyFuelTrend: monthlyProfitability.map((m) => ({
      label: m.label,
      fuelCost: m.fuelCost,
      liters: 0,
    })),
    truckFuelRankings: fleetProfitabilityList.map((f) => ({
      truckCode: f.truckCode,
      policeNumber: f.policeNumber,
      km: f.totalKm,
      liters: 0,
      kmPerLiter: null,
      fuelCost: f.fuelCost,
      costPerKm: f.totalKm > 0 ? f.fuelCost / f.totalKm : null,
      flag: f.totalKm === 0 ? 'NOT ENOUGH DATA' : 'NORMAL',
    })),
  }

  const maintCategoryMap = new Map<string, { cost: number; count: number }>()
  maintenanceRecords.forEach((m) => {
    const cat = m.maintenanceType || 'Routine'
    const curr = maintCategoryMap.get(cat) || { cost: 0, count: 0 }
    curr.cost += Number(m.totalCost || 0)
    curr.count += 1
    maintCategoryMap.set(cat, curr)
  })

  const maintenanceIntelligence: MaintenanceIntelligenceSummary = {
    totalMaintenanceCost: maintenanceCostTotal,
    serviceCount: maintenanceRecords.length,
    avgCostPerService: maintenanceRecords.length > 0 ? maintenanceCostTotal / maintenanceRecords.length : null,
    categoryBreakdown: Array.from(maintCategoryMap.entries()).map(([category, val]) => ({
      category,
      cost: val.cost,
      count: val.count,
    })),
    overdueSchedulesCount: 0,
    mostExpensiveTruckMaintenance: fleetProfitabilityList
      .filter((f) => f.maintenanceCost > 0)
      .map((f) => ({ truckCode: f.truckCode, cost: f.maintenanceCost, serviceCount: 1 })),
  }

  const activeTires = tires.filter((t) => t.status === 'ACTIVE')
  const dueTires = tires.filter((t) => t.status === 'REPLACEMENT_DUE' || t.status === 'WARNING' || t.status === 'CRITICAL')

  const tireIntelligence: TireIntelligenceSummary = {
    totalPurchaseCost: tireCostTotal,
    activeTiresCount: activeTires.length,
    replacementDueCount: dueTires.length,
    avgTireCostPerKm: totalDistanceKm > 0 ? tireCostTotal / totalDistanceKm : null,
    tiresNearReplacement: dueTires.map((t) => ({
      id: t.id,
      tireCode: t.tireCode,
      brand: t.brand,
      currentKm: t.currentKm,
      lifetimeKm: t.expectedLifetimeKm,
      status: t.status,
    })),
  }

  // ----------------------------------------------------
  // EXECUTIVE INSIGHTS (AI DYNAMIC RULE-BASED INSIGHTS)
  // ----------------------------------------------------
  const insights: string[] = []

  if (contracts.length === 0) {
    insights.push('Not enough data to generate reliable executive insights. Record your first trip contract to activate intelligence metrics.')
  } else {
    if (revenueGrowthPct !== null) {
      const direction = revenueGrowthPct >= 0 ? 'increased' : 'decreased'
      insights.push(`Revenue ${direction} ${Math.abs(revenueGrowthPct).toFixed(1)}% compared with the previous period.`)
    }

    if (totalOperatingCost > 0 && actualFuelCost > 0) {
      const fuelSharePct = ((actualFuelCost / totalOperatingCost) * 100).toFixed(1)
      insights.push(`Fuel represents ${fuelSharePct}% of total operating costs across all fleet trips.`)
    }

    if (fleetProfitabilityList.length > 0 && fleetProfitabilityList[0].netProfit > 0) {
      insights.push(`Truck ${fleetProfitabilityList[0].truckCode} (${fleetProfitabilityList[0].policeNumber}) generated the highest net contribution this period.`)
    }

    if (customerProfitabilityList.length > 0 && totalRevenue > 0) {
      const topCust = customerProfitabilityList[0]
      const custShare = ((topCust.revenue / totalRevenue) * 100).toFixed(1)
      insights.push(`Customer ${topCust.customerName} contributed ${custShare}% of total company revenue.`)
    }

    if (dueTires.length > 0) {
      insights.push(`${dueTires.length} tires are approaching or have reached their replacement threshold.`)
    }
  }

  return {
    summary,
    profitTrend,
    monthlyProfitability,
    contractProfitability,
    fleetProfitability: fleetProfitabilityList,
    driverPerformance: driverPerformanceList,
    customerProfitability: customerProfitabilityList,
    driverCashFlow,
    fuelIntelligence,
    maintenanceIntelligence,
    tireIntelligence,
    monthlyPnLStatement,
    availableMonths,
    insights,
  }
}
