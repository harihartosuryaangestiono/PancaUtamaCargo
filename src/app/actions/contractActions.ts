'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { syncShipmentTires } from '@/lib/services/tireService'
import { revalidatePath } from 'next/cache'

export interface CreateLegInput {
  origin: string
  destination: string
  cargoType: string
  cargoWeightTon: number
  distanceKm: number
  contractValue: number
  tollCost?: number
  fuelCost?: number
  otherCost?: number
  departureDate?: string
  arrivalDate?: string
  notes?: string
  customerId?: string
}

export interface CreateContractInput {
  customerId: string
  truckId: string
  driverId?: string
  driverName: string
  startDate: string
  endDate?: string
  notes?: string
  outboundLeg: CreateLegInput
  returnLeg: CreateLegInput
  driverAdvanceAmount?: number
}

export async function createTripContractAction(input: CreateContractInput) {
  const session = await requireOwner()

  if (!input.customerId || !input.truckId || (!input.driverName && !input.driverId)) {
    return { error: 'Customer, Truck, dan Supir wajib diisi.' }
  }

  if (!input.outboundLeg.origin || !input.outboundLeg.destination) {
    return { error: 'Rute asal dan tujuan ERP 1 Berangkat wajib diisi.' }
  }

  if (!input.returnLeg.origin || !input.returnLeg.destination) {
    return { error: 'Rute asal dan tujuan ERP 2 Pulang wajib diisi.' }
  }

  // Generate unique Contract Number
  const count = await prisma.tripContract.count()
  const contractNumber = `CTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const advanceAmount = input.driverAdvanceAmount !== undefined ? input.driverAdvanceAmount : 3000000

  const result = await prisma.$transaction(async (tx) => {
    let driverId = input.driverId || null
    let driverName = input.driverName

    if (driverId) {
      const d = await tx.driver.findUnique({ where: { id: driverId } })
      if (d) driverName = d.name
    }

    // 1. Create Contract
    const contract = await tx.tripContract.create({
      data: {
        contractNumber,
        truckId: input.truckId,
        driverId,
        driverName,
        customerId: input.customerId,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: 'IN_PROGRESS',
        notes: input.notes || null,
        createdById: session.userId,
      },
    })

    // 2. Outbound Leg (ERP 1)
    const outToll = input.outboundLeg.tollCost || 0
    const outValue = input.outboundLeg.contractValue || 0
    const leg1 = await tx.tripLeg.create({
      data: {
        contractId: contract.id,
        legNumber: 1,
        direction: 'OUTBOUND',
        origin: input.outboundLeg.origin,
        destination: input.outboundLeg.destination,
        cargoType: input.outboundLeg.cargoType || 'General Freight',
        cargoWeightTon: input.outboundLeg.cargoWeightTon || 0,
        distanceKm: input.outboundLeg.distanceKm || 0,
        contractValue: outValue,
        driverPercentage: 53.0,
        companyPercentage: 47.0,
        tollCost: outToll,
        companyTollCost: outToll * 0.60,
        driverTollCost: outToll * 0.40,
        fuelCost: input.outboundLeg.fuelCost || 0,
        otherCost: input.outboundLeg.otherCost || 0,
        status: 'IN_PROGRESS',
        departureDate: input.outboundLeg.departureDate ? new Date(input.outboundLeg.departureDate) : new Date(input.startDate),
        arrivalDate: input.outboundLeg.arrivalDate ? new Date(input.outboundLeg.arrivalDate) : null,
        notes: input.outboundLeg.notes || null,
        customerId: input.outboundLeg.customerId || input.customerId,
      },
    })

    // 3. Return Leg (ERP 2)
    const retToll = input.returnLeg.tollCost || 0
    const retValue = input.returnLeg.contractValue || 0
    const leg2 = await tx.tripLeg.create({
      data: {
        contractId: contract.id,
        legNumber: 2,
        direction: 'RETURN',
        origin: input.returnLeg.origin,
        destination: input.returnLeg.destination,
        cargoType: input.returnLeg.cargoType || 'General Freight',
        cargoWeightTon: input.returnLeg.cargoWeightTon || 0,
        distanceKm: input.returnLeg.distanceKm || 0,
        contractValue: retValue,
        driverPercentage: 53.0,
        companyPercentage: 47.0,
        tollCost: retToll,
        companyTollCost: retToll * 0.60,
        driverTollCost: retToll * 0.40,
        fuelCost: input.returnLeg.fuelCost || 0,
        otherCost: input.returnLeg.otherCost || 0,
        status: 'IN_PROGRESS',
        departureDate: input.returnLeg.departureDate ? new Date(input.returnLeg.departureDate) : new Date(input.startDate),
        arrivalDate: input.returnLeg.arrivalDate ? new Date(input.returnLeg.arrivalDate) : null,
        notes: input.returnLeg.notes || null,
        customerId: input.returnLeg.customerId || input.customerId,
      },
    })

    // 4. Create Driver Advance (Uang Jalan)
    const advance = await tx.driverAdvance.create({
      data: {
        contractId: contract.id,
        driverId,
        driverName,
        amount: advanceAmount,
        givenAt: new Date(input.startDate),
        status: 'GIVEN',
        notes: `Uang jalan awal kontrak ${contractNumber}`,
        createdById: session.userId,
      },
    })

    // 6. Automatically update Truck Odometer (totalKm) and Sync Active Tires
    const totalLegDistance = (input.outboundLeg.distanceKm || 0) + (input.returnLeg.distanceKm || 0)
    if (totalLegDistance > 0) {
      const truck = await tx.truck.findUnique({ where: { id: input.truckId } })
      if (truck) {
        const startKm = truck.totalKm
        const endKm = startKm + totalLegDistance
        await tx.truck.update({
          where: { id: input.truckId },
          data: { totalKm: endKm },
        })
        await syncShipmentTires(input.truckId, startKm, endKm, 'ADD', tx)
      }
    }

    return { contract, leg1, leg2, advance }
  }, { timeout: 30000, maxWait: 10000 })

  await createAuditLog({
    action: 'CREATE_TRIP_CONTRACT',
    module: 'CONTRACT',
    recordId: result.contract.id,
    afterValue: result.contract,
  })

  revalidatePath('/contracts')
  revalidatePath('/dashboard')
  return { success: true, contract: result.contract }
}

export async function getContractsAction(params?: { status?: string; search?: string }) {
  await requireAuth()

  const whereClause: any = {}
  if (params?.status && params.status !== 'ALL') {
    whereClause.status = params.status
  }
  if (params?.search) {
    whereClause.OR = [
      { contractNumber: { contains: params.search, mode: 'insensitive' } },
      { driverName: { contains: params.search, mode: 'insensitive' } },
      { truck: { policeNumber: { contains: params.search, mode: 'insensitive' } } },
      { customer: { name: { contains: params.search, mode: 'insensitive' } } },
    ]
  }

  const contracts = await prisma.tripContract.findMany({
    where: whereClause,
    include: {
      truck: true,
      customer: true,
      legs: {
        include: { customer: true },
        orderBy: { legNumber: 'asc' },
      },
      advances: true,
      settlements: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return contracts.map((c: any) => {
    let totalRevenue = 0
    let totalDistance = 0
    let totalToll = 0
    let totalCompanyToll = 0

    for (const leg of c.legs) {
      if (leg.contractValue) totalRevenue += Number(leg.contractValue)
      if (leg.distanceKm) totalDistance += leg.distanceKm
      if (leg.tollCost) totalToll += Number(leg.tollCost)
      if (leg.companyTollCost) totalCompanyToll += Number(leg.companyTollCost)
    }

    const taxDeduction = totalRevenue * 0.02
    const netContractValue = totalRevenue * 0.98
    // Driver Share: 53% of gross contract value (before 2% tax)
    const totalDriverShare = totalRevenue * 0.53
    const totalCompanyShare = totalRevenue * 0.47
    // Total driver entitlement includes 60% company toll reimbursement
    const totalDriverEntitlement = totalDriverShare + totalCompanyToll

    let totalAdvance = 0
    for (const adv of c.advances) {
      if (adv.amount) totalAdvance += Number(adv.amount)
    }

    const settlementDiff = totalDriverEntitlement - totalAdvance

    return JSON.parse(
      JSON.stringify({
        ...c,
        totalRevenue,
        taxDeduction,
        netContractValue,
        totalDistance,
        totalToll,
        totalCompanyToll,
        totalDriverShare,
        totalCompanyShare,
        totalDriverEntitlement,
        totalAdvance,
        settlementDiff,
      })
    )
  })
}

export async function getContractByIdAction(contractId: string) {
  await requireAuth()

  const c = await prisma.tripContract.findUnique({
    where: { id: contractId },
    include: {
      truck: true,
      customer: true,
      createdBy: { select: { id: true, name: true, email: true } },
      legs: {
        include: { customer: true },
        orderBy: { legNumber: 'asc' },
      },
      advances: { orderBy: { givenAt: 'desc' } },
      settlements: { orderBy: { settlementDate: 'desc' } },
      fuelLogs: true,
    },
  })

  if (!c) return null

  let totalRevenue = 0
  let totalDistance = 0
  let totalToll = 0
  let totalCompanyToll = 0
  let totalDriverToll = 0
  let totalFuelCost = 0
  let totalOtherCost = 0

  for (const leg of c.legs) {
    if (leg.contractValue) totalRevenue += Number(leg.contractValue)
    if (leg.distanceKm) totalDistance += leg.distanceKm
    if (leg.tollCost) totalToll += Number(leg.tollCost)
    if (leg.companyTollCost) totalCompanyToll += Number(leg.companyTollCost)
    if (leg.driverTollCost) totalDriverToll += Number(leg.driverTollCost)
    if (leg.fuelCost) totalFuelCost += Number(leg.fuelCost)
    if (leg.otherCost) totalOtherCost += Number(leg.otherCost)
  }

  const taxDeduction = totalRevenue * 0.02
  const netContractValue = totalRevenue * 0.98

  // 1. Driver share: 53% of GROSS contract value (before 2% tax)
  const driverAllocation = totalRevenue * 0.53

  // 2. Total Driver Entitlement: 53% gross + 60% company toll reimbursement
  const totalDriverEntitlement = driverAllocation + totalCompanyToll

  // 3. Company Share & Contribution
  const companyAllocation = totalRevenue * 0.47
  const companyExpenses = totalCompanyToll + totalFuelCost + totalOtherCost
  // Net Company Contribution = Gross (47%) - Tax (2%) - Company Expenses (Toll 60% + Fuel + Inap)
  const netCompanyContribution = netContractValue - driverAllocation - companyExpenses

  let totalAdvance = 0
  for (const adv of c.advances) {
    if (adv.amount) totalAdvance += Number(adv.amount)
  }

  // Settlement Difference = Total Driver Entitlement - Total Advances Given
  const settlementDiff = totalDriverEntitlement - totalAdvance

  return JSON.parse(
    JSON.stringify({
      ...c,
      totalRevenue,
      taxDeduction,
      netContractValue,
      totalDistance,
      totalToll,
      totalCompanyToll,
      totalDriverToll,
      totalFuelCost,
      totalOtherCost,
      driverAllocation,
      totalDriverEntitlement,
      companyAllocation,
      companyExpenses,
      netCompanyContribution,
      totalAdvance,
      settlementDiff,
    })
  )
}

export async function updateContractStatusAction(contractId: string, status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') {
  await requireOwner()

  const c = await prisma.tripContract.findUnique({ where: { id: contractId } })
  if (!c) return { error: 'Kontrak tidak ditemukan.' }

  const updated = await prisma.tripContract.update({
    where: { id: contractId },
    data: { status },
  })

  await prisma.tripLeg.updateMany({
    where: { contractId },
    data: { status },
  })

  await createAuditLog({
    action: 'UPDATE_TRIP_CONTRACT_STATUS',
    module: 'CONTRACT',
    recordId: contractId,
    beforeValue: c,
    afterValue: updated,
  })

  revalidatePath(`/contracts/${contractId}`)
  revalidatePath('/contracts')
  return { success: true, contract: updated }
}

export interface UpdateContractOperationalCostsInput {
  contractId: string
  outboundLegId: string
  outboundTollCost: number
  outboundFuelCost: number
  outboundInapCost: number
  returnLegId: string
  returnTollCost: number
  returnFuelCost: number
  returnInapCost: number
}

export async function updateContractOperationalCostsAction(input: UpdateContractOperationalCostsInput) {
  const session = await requireOwner()

  const contract = await prisma.tripContract.findUnique({
    where: { id: input.contractId },
    include: { legs: true },
  })
  if (!contract) return { error: 'Kontrak tidak ditemukan.' }

  await prisma.$transaction(async (tx) => {
    // 1. Update Outbound Leg (ERP 1)
    const outToll = Number(input.outboundTollCost) || 0
    await tx.tripLeg.update({
      where: { id: input.outboundLegId },
      data: {
        tollCost: outToll,
        companyTollCost: outToll * 0.60,
        driverTollCost: outToll * 0.40,
        fuelCost: Number(input.outboundFuelCost) || 0,
        otherCost: Number(input.outboundInapCost) || 0,
      },
    })

    // 2. Update Return Leg (ERP 2)
    const retToll = Number(input.returnTollCost) || 0
    await tx.tripLeg.update({
      where: { id: input.returnLegId },
      data: {
        tollCost: retToll,
        companyTollCost: retToll * 0.60,
        driverTollCost: retToll * 0.40,
        fuelCost: Number(input.returnFuelCost) || 0,
        otherCost: Number(input.returnInapCost) || 0,
      },
    })
  })

  await createAuditLog({
    action: 'UPDATE_CONTRACT_OPERATIONAL_COSTS',
    module: 'CONTRACT',
    recordId: input.contractId,
    afterValue: input,
  })

  revalidatePath(`/contracts/${input.contractId}`)
  revalidatePath('/contracts')
  revalidatePath('/reports/executive')
  return { success: true }
}

export interface UpdateLegInput {
  id: string
  origin: string
  destination: string
  cargoType: string
  cargoWeightTon: number
  distanceKm: number
  contractValue: number
  tollCost?: number
  fuelCost?: number
  otherCost?: number
  customerId?: string
}

export interface UpdateTripContractInput {
  contractId: string
  customerId: string
  truckId: string
  driverId?: string
  driverName: string
  startDate: string
  notes?: string
  outboundLeg: UpdateLegInput
  returnLeg: UpdateLegInput
}

export async function updateTripContractAction(input: UpdateTripContractInput) {
  const session = await requireOwner()

  if (!input.contractId) {
    return { error: 'ID Kontrak tidak ditemukan.' }
  }

  if (!input.customerId || !input.truckId || (!input.driverName && !input.driverId)) {
    return { error: 'Customer, Truck, dan Supir wajib diisi.' }
  }

  if (!input.outboundLeg.origin || !input.outboundLeg.destination) {
    return { error: 'Rute asal dan tujuan ERP 1 Berangkat wajib diisi.' }
  }

  if (!input.returnLeg.origin || !input.returnLeg.destination) {
    return { error: 'Rute asal dan tujuan ERP 2 Pulang wajib diisi.' }
  }

  const existing = await prisma.tripContract.findUnique({
    where: { id: input.contractId },
    include: { legs: true },
  })

  if (!existing) {
    return { error: 'Kontrak tidak ditemukan.' }
  }

  const result = await prisma.$transaction(async (tx) => {
    let driverId = input.driverId || null
    let driverName = input.driverName

    if (driverId) {
      const d = await tx.driver.findUnique({ where: { id: driverId } })
      if (d) driverName = d.name
    }

    // 1. Update Contract Header
    const updatedContract = await tx.tripContract.update({
      where: { id: input.contractId },
      data: {
        customerId: input.customerId,
        truckId: input.truckId,
        driverId,
        driverName,
        startDate: new Date(input.startDate),
        notes: input.notes || null,
      },
    })

    // 2. Update Outbound Leg (ERP 1)
    const outToll = Number(input.outboundLeg.tollCost) || 0
    const outValue = Number(input.outboundLeg.contractValue) || 0
    const updatedOutLeg = await tx.tripLeg.update({
      where: { id: input.outboundLeg.id },
      data: {
        origin: input.outboundLeg.origin,
        destination: input.outboundLeg.destination,
        cargoType: input.outboundLeg.cargoType || 'General Freight',
        cargoWeightTon: Number(input.outboundLeg.cargoWeightTon) || 0,
        distanceKm: Number(input.outboundLeg.distanceKm) || 0,
        contractValue: outValue,
        tollCost: outToll,
        companyTollCost: outToll * 0.60,
        driverTollCost: outToll * 0.40,
        fuelCost: Number(input.outboundLeg.fuelCost) || 0,
        otherCost: Number(input.outboundLeg.otherCost) || 0,
        customerId: input.outboundLeg.customerId || input.customerId,
      },
    })

    // 3. Update Return Leg (ERP 2)
    const retToll = Number(input.returnLeg.tollCost) || 0
    const retValue = Number(input.returnLeg.contractValue) || 0
    const updatedRetLeg = await tx.tripLeg.update({
      where: { id: input.returnLeg.id },
      data: {
        origin: input.returnLeg.origin,
        destination: input.returnLeg.destination,
        cargoType: input.returnLeg.cargoType || 'General Freight',
        cargoWeightTon: Number(input.returnLeg.cargoWeightTon) || 0,
        distanceKm: Number(input.returnLeg.distanceKm) || 0,
        contractValue: retValue,
        tollCost: retToll,
        companyTollCost: retToll * 0.60,
        driverTollCost: retToll * 0.40,
        fuelCost: Number(input.returnLeg.fuelCost) || 0,
        otherCost: Number(input.returnLeg.otherCost) || 0,
        customerId: input.returnLeg.customerId || input.customerId,
      },
    })

    return { contract: updatedContract, leg1: updatedOutLeg, leg2: updatedRetLeg }
  }, { timeout: 30000, maxWait: 10000 })

  await createAuditLog({
    action: 'UPDATE_TRIP_CONTRACT',
    module: 'CONTRACT',
    recordId: input.contractId,
    beforeValue: existing,
    afterValue: result.contract,
  })

  revalidatePath(`/contracts/${input.contractId}`)
  revalidatePath('/contracts')
  revalidatePath('/dashboard')
  revalidatePath('/reports/executive')
  revalidatePath('/financials/bookkeeping')
  return { success: true, contract: result.contract }
}

