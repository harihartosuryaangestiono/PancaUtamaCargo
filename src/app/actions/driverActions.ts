'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireFinanceOrOwner, requireOwner } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { DriverStatus, DriverLedgerType, SettlementDifferenceResolution, SettlementStatus } from '@prisma/client'

export interface CreateDriverInput {
  name: string
  phone?: string
  address?: string
  licenseNumber?: string
  licenseType?: string
  licenseExpiry?: string
  notes?: string
}

export interface UpdateDriverInput {
  name?: string
  phone?: string
  address?: string
  licenseNumber?: string
  licenseType?: string
  licenseExpiry?: string
  status?: DriverStatus
  notes?: string
}

export interface RecordDriverAdvanceInput {
  contractId: string
  tripLegId?: string
  driverId?: string
  driverName?: string
  amount: number
  notes?: string
  givenAt?: string
}

export interface SettleDriverInput {
  contractId: string
  driverId?: string
  driverName?: string
  differenceResolution?: SettlementDifferenceResolution
  notes?: string
}

// ----------------------------------------------------
// 1. DRIVER CRUD & DIRECTORY
// ----------------------------------------------------

export async function createDriverAction(input: CreateDriverInput) {
  const session = await requireFinanceOrOwner()

  if (!input.name || input.name.trim() === '') {
    return { error: 'Nama pengemudi wajib diisi.' }
  }

  try {
    const driver = await prisma.$transaction(async (tx) => {
      // Generate sequential code: DRV-001
      const count = await tx.driver.count()
      let nextNum = count + 1
      let driverCode = `DRV-${String(nextNum).padStart(3, '0')}`

      // Ensure uniqueness
      let existing = await tx.driver.findUnique({ where: { driverCode } })
      while (existing) {
        nextNum++
        driverCode = `DRV-${String(nextNum).padStart(3, '0')}`
        existing = await tx.driver.findUnique({ where: { driverCode } })
      }

      const created = await tx.driver.create({
        data: {
          driverCode,
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          address: input.address?.trim() || null,
          licenseNumber: input.licenseNumber?.trim() || null,
          licenseType: input.licenseType?.trim() || 'SIM B2 Umum',
          licenseExpiry: input.licenseExpiry ? new Date(input.licenseExpiry) : null,
          notes: input.notes?.trim() || null,
          status: 'ACTIVE',
        },
      })

      const user = await tx.user.findFirst({
        where: {
          OR: [
            { id: session.userId },
            ...(session.email ? [{ email: session.email }] : []),
            ...(session.role ? [{ role: session.role }] : []),
          ],
        },
      })

      if (user) {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            userName: user.name || session.name,
            role: user.role || session.role,
            action: 'DRIVER_CREATE',
            module: 'DRIVER',
            recordId: created.id,
            afterValue: JSON.stringify(created),
          },
        })
      }

      return created
    })

    revalidatePath('/drivers')
    return { success: true, driver }
  } catch (err: any) {
    return { error: err.message || 'Gagal menambahkan pengemudi.' }
  }
}

export async function getDriversAction(params?: { query?: string; status?: string }) {
  await requireAuth()

  const where: any = {}
  if (params?.status && params.status !== 'ALL') {
    where.status = params.status as DriverStatus
  }
  if (params?.query && params.query.trim() !== '') {
    const q = params.query.trim()
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { driverCode: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { licenseNumber: { contains: q, mode: 'insensitive' } },
    ]
  }

  const drivers = await prisma.driver.findMany({
    where,
    include: {
      tripContracts: {
        include: {
          legs: true,
          settlements: true,
        },
      },
      advances: true,
      settlements: true,
      ledgerEntries: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()

  return drivers.map((d) => {
    const activeContracts = d.tripContracts.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'PLANNED').length
    const totalContracts = d.tripContracts.length

    let totalKm = 0
    let totalRevenue = 0
    let totalDriverAllocation = 0

    d.tripContracts.forEach((c) => {
      c.legs.forEach((leg) => {
        totalKm += leg.distanceKm || 0
        const legRev = Number(leg.contractValue || 0)
        totalRevenue += legRev
        totalDriverAllocation += legRev * ((leg.driverPercentage || 53) / 100)
      })
    })

    const totalAdvances = d.advances.reduce((acc, a) => acc + Number(a.amount || 0), 0)
    const totalSettled = d.settlements
      .filter((s) => s.status === 'SETTLED')
      .reduce((acc, s) => acc + Number(s.driverShare || 0), 0)

    const outstandingBalance = totalDriverAllocation - totalAdvances

    // License expiry calculation
    let licenseStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' = 'VALID'
    let daysUntilExpiry: number | null = null

    if (d.licenseExpiry) {
      const diffTime = d.licenseExpiry.getTime() - now.getTime()
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry <= 0) {
        licenseStatus = 'EXPIRED'
      } else if (daysUntilExpiry <= 30) {
        licenseStatus = 'EXPIRING_SOON'
      }
    }

    return {
      id: d.id,
      driverCode: d.driverCode,
      name: d.name,
      phone: d.phone,
      address: d.address,
      licenseNumber: d.licenseNumber,
      licenseType: d.licenseType,
      licenseExpiry: d.licenseExpiry ? d.licenseExpiry.toISOString() : null,
      status: d.status,
      notes: d.notes,
      createdAt: d.createdAt.toISOString(),
      activeContracts,
      totalContracts,
      totalKm,
      totalRevenue,
      totalDriverAllocation,
      totalAdvances,
      totalSettled,
      outstandingBalance,
      licenseStatus,
      daysUntilExpiry,
    }
  })
}

export async function getDriverByIdAction(id: string) {
  await requireAuth()

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      tripContracts: {
        include: {
          truck: true,
          customer: true,
          legs: true,
          advances: true,
          settlements: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      advances: {
        include: {
          contract: true,
          createdBy: { select: { name: true } },
        },
        orderBy: { givenAt: 'desc' },
      },
      settlements: {
        include: {
          contract: true,
        },
        orderBy: { settlementDate: 'desc' },
      },
      ledgerEntries: {
        include: {
          contract: true,
          createdBy: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!driver) return null

  const now = new Date()

  // Aggregated Metrics
  const activeContractsCount = driver.tripContracts.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'PLANNED').length
  const completedContractsCount = driver.tripContracts.filter((c) => c.status === 'COMPLETED').length
  const totalContractsCount = driver.tripContracts.length

  let totalKm = 0
  let totalRevenue = 0
  let totalDriverAllocation = 0
  const allErpTrips: Array<{
    id: string
    contractNumber: string
    contractId: string
    legNumber: number
    direction: string
    origin: string
    destination: string
    cargoType: string
    cargoWeightTon: number
    distanceKm: number
    contractValue: number
    driverShare: number
    companyShare: number
    status: string
  }> = []

  driver.tripContracts.forEach((c) => {
    c.legs.forEach((leg) => {
      totalKm += leg.distanceKm || 0
      const legRev = Number(leg.contractValue || 0)
      const legDriverShare = legRev * ((leg.driverPercentage || 53) / 100)
      const legCompanyShare = legRev * ((leg.companyPercentage || 47) / 100)

      totalRevenue += legRev
      totalDriverAllocation += legDriverShare

      allErpTrips.push({
        id: leg.id,
        contractNumber: c.contractNumber,
        contractId: c.id,
        legNumber: leg.legNumber,
        direction: leg.direction,
        origin: leg.origin,
        destination: leg.destination,
        cargoType: leg.cargoType,
        cargoWeightTon: leg.cargoWeightTon,
        distanceKm: leg.distanceKm,
        contractValue: legRev,
        driverShare: legDriverShare,
        companyShare: legCompanyShare,
        status: leg.status,
      })
    })
  })

  const totalAdvances = driver.advances.reduce((acc, a) => acc + Number(a.amount || 0), 0)
  const totalSettled = driver.settlements
    .filter((s) => s.status === 'SETTLED')
    .reduce((acc, s) => acc + Number(s.driverShare || 0), 0)

  const outstandingBalance = totalDriverAllocation - totalAdvances

  // Safe Division Ratios
  const avgRevenuePerContract = totalContractsCount > 0 ? totalRevenue / totalContractsCount : null
  const avgRevenuePerKm = totalKm > 0 ? totalRevenue / totalKm : null
  const avgAllocationPerTrip = allErpTrips.length > 0 ? totalDriverAllocation / allErpTrips.length : null
  const avgKmPerContract = totalContractsCount > 0 ? totalKm / totalContractsCount : null

  // License Expiration Status
  let licenseStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' = 'VALID'
  let daysUntilExpiry: number | null = null

  if (driver.licenseExpiry) {
    const diffTime = driver.licenseExpiry.getTime() - now.getTime()
    daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry <= 0) {
      licenseStatus = 'EXPIRED'
    } else if (daysUntilExpiry <= 30) {
      licenseStatus = 'EXPIRING_SOON'
    }
  }

  // Activity Stream Aggregation
  const activityStream: Array<{
    id: string
    type: string
    title: string
    description: string
    amount?: number
    date: string
    link?: string
  }> = []

  driver.tripContracts.forEach((c) => {
    activityStream.push({
      id: `c-create-${c.id}`,
      type: 'CONTRACT_CREATED',
      title: `Kontrak ${c.contractNumber} Dibuat`,
      description: `Truk ${c.truck.policeNumber} • Pelanggan: ${c.customer.name}`,
      date: c.createdAt.toISOString(),
      link: `/contracts/${c.id}`,
    })
    if (c.status === 'COMPLETED') {
      activityStream.push({
        id: `c-comp-${c.id}`,
        type: 'CONTRACT_COMPLETED',
        title: `Kontrak ${c.contractNumber} Selesai`,
        description: `Perjalanan Pulang-Pergi Selesai`,
        date: c.updatedAt.toISOString(),
        link: `/contracts/${c.id}`,
      })
    }
  })

  driver.ledgerEntries.forEach((le) => {
    let title = 'Transaksi Kas Pengemudi'
    if (le.type === 'DRIVER_ADVANCE_GIVEN') title = 'Uang Jalan Diberikan'
    else if (le.type === 'DRIVER_SETTLEMENT_PAYMENT') title = 'Pembayaran Pelunasan Totalan'
    else if (le.type === 'DRIVER_REFUND') title = 'Pengembalian Kelebihan (Refund)'
    else if (le.type === 'DRIVER_OFFSET') title = 'Kompensasi Perjalanan Berikutnya (Offset)'

    activityStream.push({
      id: `le-${le.id}`,
      type: le.type,
      title,
      description: le.notes || (le.contract ? `Kontrak ${le.contract.contractNumber}` : 'Pencatatan Kas'),
      amount: Number(le.amount),
      date: le.date.toISOString(),
      link: le.contractId ? `/contracts/${le.contractId}` : undefined,
    })
  })

  activityStream.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return JSON.parse(
    JSON.stringify({
      id: driver.id,
      driverCode: driver.driverCode,
      name: driver.name,
      phone: driver.phone,
      address: driver.address,
      licenseNumber: driver.licenseNumber,
      licenseType: driver.licenseType,
      licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.toISOString() : null,
      status: driver.status,
      notes: driver.notes,
      createdAt: driver.createdAt.toISOString(),
      metrics: {
        activeContractsCount,
        completedContractsCount,
        totalContractsCount,
        totalKm,
        totalRevenue,
        totalDriverAllocation,
        totalAdvances,
        totalSettled,
        outstandingBalance,
        avgRevenuePerContract,
        avgRevenuePerKm,
        avgAllocationPerTrip,
        avgKmPerContract,
        licenseStatus,
        daysUntilExpiry,
      },
      contracts: driver.tripContracts.map((c) => ({
        id: c.id,
        contractNumber: c.contractNumber,
        truckPoliceNumber: c.truck.policeNumber,
        customerName: c.customer.name,
        startDate: c.startDate.toISOString(),
        status: c.status,
        totalRevenue: c.legs.reduce((sum, leg) => sum + Number(leg.contractValue || 0), 0),
        driverAllocation: c.legs.reduce(
          (sum, leg) => sum + Number(leg.contractValue || 0) * 0.98 * ((leg.driverPercentage || 53) / 100),
          0
        ),
        advancesGiven: c.advances.reduce((sum, a) => sum + Number(a.amount || 0), 0),
      })),
      erpTrips: allErpTrips,
      advances: driver.advances.map((a) => ({
        id: a.id,
        contractNumber: a.contract.contractNumber,
        contractId: a.contractId,
        amount: Number(a.amount),
        givenAt: a.givenAt.toISOString(),
        status: a.status,
        notes: a.notes,
        givenByName: a.createdBy.name,
      })),
      settlements: driver.settlements.map((s) => ({
        id: s.id,
        contractNumber: s.contract.contractNumber,
        contractId: s.contractId,
        driverShare: Number(s.driverShare),
        advanceAmount: Number(s.advanceAmount),
        settlementDifference: Number(s.settlementDifference),
        resolution: s.differenceResolution,
        status: s.status,
        settlementDate: s.settlementDate.toISOString(),
      })),
      ledgerEntries: driver.ledgerEntries.map((le) => ({
        id: le.id,
        type: le.type,
        amount: Number(le.amount),
        date: le.date.toISOString(),
        notes: le.notes,
        contractNumber: le.contract?.contractNumber || null,
        createdByName: le.createdBy.name,
      })),
      activityStream,
    })
  )
}

export async function updateDriverAction(id: string, input: UpdateDriverInput) {
  const session = await requireFinanceOrOwner()

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.driver.findUnique({ where: { id } })
      if (!existing) throw new Error('Pengemudi tidak ditemukan.')

      const driver = await tx.driver.update({
        where: { id },
        data: {
          name: input.name !== undefined ? input.name.trim() : existing.name,
          phone: input.phone !== undefined ? input.phone.trim() || null : existing.phone,
          address: input.address !== undefined ? input.address.trim() || null : existing.address,
          licenseNumber: input.licenseNumber !== undefined ? input.licenseNumber.trim() || null : existing.licenseNumber,
          licenseType: input.licenseType !== undefined ? input.licenseType.trim() || null : existing.licenseType,
          licenseExpiry: input.licenseExpiry !== undefined ? (input.licenseExpiry ? new Date(input.licenseExpiry) : null) : existing.licenseExpiry,
          status: input.status !== undefined ? input.status : existing.status,
          notes: input.notes !== undefined ? input.notes.trim() || null : existing.notes,
        },
      })

      const user = await tx.user.findFirst({
        where: {
          OR: [
            { id: session.userId },
            ...(session.email ? [{ email: session.email }] : []),
            ...(session.role ? [{ role: session.role }] : []),
          ],
        },
      })

      if (user) {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            userName: user.name || session.name,
            role: user.role || session.role,
            action: existing.status !== driver.status ? 'DRIVER_STATUS_CHANGE' : 'DRIVER_UPDATE',
            module: 'DRIVER',
            recordId: driver.id,
            beforeValue: JSON.stringify(existing),
            afterValue: JSON.stringify(driver),
          },
        })
      }

      return driver
    })

    revalidatePath('/drivers')
    revalidatePath(`/drivers/${id}`)
    return { success: true, driver: updated }
  } catch (err: any) {
    return { error: err.message || 'Gagal memperbarui data pengemudi.' }
  }
}

export async function deleteDriverAction(id: string) {
  const session = await requireOwner()

  try {
    await prisma.$transaction(async (tx) => {
      const driver = await tx.driver.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              tripContracts: true,
              advances: true,
              settlements: true,
              ledgerEntries: true,
            },
          },
        },
      })

      if (!driver) throw new Error('Pengemudi tidak ditemukan.')

      const { tripContracts, advances, settlements, ledgerEntries } = driver._count
      if (tripContracts > 0 || advances > 0 || settlements > 0 || ledgerEntries > 0) {
        throw new Error('Tidak dapat menghapus pengemudi yang sudah memiliki riwayat kontrak/keuangan.')
      }

      await tx.driver.delete({ where: { id } })

      const user = await tx.user.findFirst({
        where: {
          OR: [
            { id: session.userId },
            ...(session.email ? [{ email: session.email }] : []),
            ...(session.role ? [{ role: session.role }] : []),
          ],
        },
      })

      if (user) {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            userName: user.name || session.name,
            role: user.role || session.role,
            action: 'DRIVER_DELETE',
            module: 'DRIVER',
            recordId: id,
            beforeValue: JSON.stringify(driver),
          },
        })
      }
    })

    revalidatePath('/drivers')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Gagal menghapus pengemudi.' }
  }
}

// ----------------------------------------------------
// 2. ADVANCE LEDGER & SETTLEMENT ENGINE
// ----------------------------------------------------

export async function recordDriverAdvanceLedgerAction(input: RecordDriverAdvanceInput) {
  const session = await requireFinanceOrOwner()

  if (!input.contractId) {
    return { error: 'ID Kontrak wajib diisi.' }
  }
  if (!input.amount || input.amount <= 0) {
    return { error: 'Nominal Uang Jalan harus lebih besar dari 0.' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const contract = await tx.tripContract.findUnique({
        where: { id: input.contractId },
        include: { driver: true },
      })

      if (!contract) throw new Error('Kontrak tidak ditemukan.')

      const driverId = input.driverId || contract.driverId || null
      const driverName = input.driverName || (contract.driver ? contract.driver.name : contract.driverName)

      const user = await tx.user.findFirst({
        where: {
          OR: [
            { id: session.userId },
            ...(session.email ? [{ email: session.email }] : []),
            ...(session.role ? [{ role: session.role }] : []),
          ],
        },
      })
      const fallbackUser = await tx.user.findFirst({ where: { role: 'OWNER' } })
      const validUserId = user?.id || fallbackUser?.id || session.userId

      // 1. Create DriverAdvance record
      const advance = await tx.driverAdvance.create({
        data: {
          contractId: contract.id,
          tripLegId: input.tripLegId || null,
          driverId,
          driverName,
          amount: input.amount,
          givenAt: input.givenAt ? new Date(input.givenAt) : new Date(),
          status: 'GIVEN',
          notes: input.notes?.trim() || null,
          createdById: validUserId,
        },
      })

      // 2. Create DriverLedgerEntry record if driverId exists
      let ledgerEntry = null
      if (driverId) {
        ledgerEntry = await tx.driverLedgerEntry.create({
          data: {
            driverId,
            contractId: contract.id,
            tripLegId: input.tripLegId || null,
            type: 'DRIVER_ADVANCE_GIVEN',
            amount: input.amount,
            date: advance.givenAt,
            notes: input.notes?.trim() || `Uang Jalan Kontrak ${contract.contractNumber}`,
            createdById: validUserId,
          },
        })
      }

      // 3. Create AuditLog entry
      if (validUserId) {
        await tx.auditLog.create({
          data: {
            userId: validUserId,
            userName: user?.name || session.name,
            role: user?.role || session.role,
            action: 'DRIVER_ADVANCE_CREATE',
            module: 'FINANCIAL',
            recordId: advance.id,
            afterValue: JSON.stringify(advance),
          },
        })
      }

      return { advance, ledgerEntry }
    })

    revalidatePath(`/contracts/${input.contractId}`)
    revalidatePath('/contracts')
    revalidatePath('/drivers')
    if (input.driverId) revalidatePath(`/drivers/${input.driverId}`)

    return { success: true, advance: result.advance }
  } catch (err: any) {
    return { error: err.message || 'Gagal mencatat Uang Jalan.' }
  }
}

export async function settleDriverLedgerAction(input: SettleDriverInput) {
  const session = await requireFinanceOrOwner()

  if (!input.contractId) {
    return { error: 'ID Kontrak wajib diisi.' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const contract = await tx.tripContract.findUnique({
        where: { id: input.contractId },
        include: {
          legs: true,
          advances: true,
          settlements: true,
          driver: true,
        },
      })

      if (!contract) throw new Error('Kontrak tidak ditemukan.')

      // Check if already settled
      const existingSettled = contract.settlements.find((s) => s.status === 'SETTLED')
      if (existingSettled) {
        throw new Error('Kontrak ini sudah diselesaikan (SETTLED). Tidak dapat melakukan totalan ulang tanpa pembatalan.')
      }

      const driverId = input.driverId || contract.driverId || null
      const driverName = input.driverName || (contract.driver ? contract.driver.name : contract.driverName)

      // Calculate Total Driver Allocation (53% driver share across ERP 1 & ERP 2)
      let totalDriverAllocation = 0
      let totalDriverToll = 0

      contract.legs.forEach((leg) => {
        const val = Number(leg.contractValue || 0)
        const dShare = val * ((leg.driverPercentage || 53) / 100)
        const dToll = Number(leg.driverTollCost || 0)
        totalDriverAllocation += dShare
        totalDriverToll += dToll
      })

      // Calculate Total Advances Given
      const totalAdvancesGiven = contract.advances
        .filter((a) => a.status === 'GIVEN' || a.status === 'SETTLED')
        .reduce((sum, a) => sum + Number(a.amount || 0), 0)

      // Settlement Difference = Driver Allocation - Total Advances
      const settlementDifference = totalDriverAllocation - totalAdvancesGiven

      let settlementStatus: SettlementStatus = 'SETTLED'
      let resolution = input.differenceResolution || null

      if (settlementDifference > 0) {
        // Company owes Driver additional payment
        resolution = resolution || 'ADDITIONAL_PAYMENT'
        settlementStatus = 'SETTLED'
      } else if (settlementDifference < 0) {
        // Driver owes Company / Overpaid
        resolution = resolution || 'RETURN_TO_COMPANY'
        settlementStatus = 'OVERPAID'
      } else {
        settlementStatus = 'SETTLED'
      }

      // Create DriverSettlement record
      const settlement = await tx.driverSettlement.create({
        data: {
          contractId: contract.id,
          driverId,
          driverName,
          driverShare: totalDriverAllocation,
          driverToll: totalDriverToll,
          advanceAmount: totalAdvancesGiven,
          finalDriverAmount: totalDriverAllocation,
          amountAlreadyPaid: totalAdvancesGiven,
          remainingAmount: settlementDifference > 0 ? settlementDifference : 0,
          settlementDifference,
          differenceResolution: resolution,
          status: settlementStatus,
          notes: input.notes?.trim() || null,
          settlementDate: new Date(),
        },
      })

      // Update Advances status to SETTLED
      await tx.driverAdvance.updateMany({
        where: { contractId: contract.id },
        data: { status: 'SETTLED' },
      })

      const user = await tx.user.findFirst({
        where: {
          OR: [
            { id: session.userId },
            ...(session.email ? [{ email: session.email }] : []),
            ...(session.role ? [{ role: session.role }] : []),
          ],
        },
      })
      const fallbackUser = await tx.user.findFirst({ where: { role: 'OWNER' } })
      const validUserId = user?.id || fallbackUser?.id || session.userId

      // Create DriverLedgerEntry if driverId is present
      if (driverId) {
        let ledgerType: DriverLedgerType = 'DRIVER_SETTLEMENT_PAYMENT'
        if (resolution === 'RETURN_TO_COMPANY') ledgerType = 'DRIVER_REFUND'
        else if (resolution === 'OFFSET_TO_NEXT_TRIP') ledgerType = 'DRIVER_OFFSET'
        else if (resolution === 'ADDITIONAL_PAYMENT') ledgerType = 'DRIVER_SETTLEMENT_PAYMENT'

        await tx.driverLedgerEntry.create({
          data: {
            driverId,
            contractId: contract.id,
            type: ledgerType,
            amount: Math.abs(settlementDifference),
            date: new Date(),
            notes: `Totalan Supir Kontrak ${contract.contractNumber} (${resolution})`,
            createdById: validUserId,
          },
        })
      }

      // Create AuditLog
      if (validUserId) {
        await tx.auditLog.create({
          data: {
            userId: validUserId,
            userName: user?.name || session.name,
            role: user?.role || session.role,
            action: 'DRIVER_SETTLEMENT_CREATE',
            module: 'FINANCIAL',
            recordId: settlement.id,
            afterValue: JSON.stringify(settlement),
          },
        })
      }

      return settlement
    })

    revalidatePath(`/contracts/${input.contractId}`)
    revalidatePath('/contracts')
    revalidatePath('/drivers')
    if (input.driverId) revalidatePath(`/drivers/${input.driverId}`)

    return { success: true, settlement: result }
  } catch (err: any) {
    return { error: err.message || 'Gagal merekosiliasi Totalan Supir.' }
  }
}

// ----------------------------------------------------
// 3. DRIVER LEADERBOARD & PERFORMANCE INTELLIGENCE
// ----------------------------------------------------

export async function getDriverLeaderboardAction(periodPreset: string = 'THIS_MONTH') {
  await requireAuth()

  const drivers = await prisma.driver.findMany({
    include: {
      tripContracts: {
        include: { legs: true, settlements: true },
      },
      advances: true,
      settlements: true,
    },
  })

  if (drivers.length === 0) {
    return []
  }

  const now = new Date()
  let startDateFilter: Date | null = null

  if (periodPreset === 'TODAY') {
    startDateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (periodPreset === 'THIS_WEEK') {
    const day = now.getDay()
    startDateFilter = new Date(now.setDate(now.getDate() - day))
  } else if (periodPreset === 'THIS_MONTH') {
    startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (periodPreset === 'LAST_MONTH') {
    startDateFilter = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  } else if (periodPreset === 'LAST_3_MONTHS') {
    startDateFilter = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  } else if (periodPreset === 'THIS_YEAR') {
    startDateFilter = new Date(now.getFullYear(), 0, 1)
  }

  const driverStats = drivers.map((d) => {
    let filteredContracts = d.tripContracts
    if (startDateFilter) {
      filteredContracts = d.tripContracts.filter((c) => c.startDate >= startDateFilter!)
    }

    let totalKm = 0
    let totalRevenue = 0
    let totalDriverAllocation = 0

    filteredContracts.forEach((c) => {
      c.legs.forEach((leg) => {
        totalKm += leg.distanceKm || 0
        const legRev = Number(leg.contractValue || 0)
        totalRevenue += legRev
        totalDriverAllocation += legRev * ((leg.driverPercentage || 53) / 100)
      })
    })

    const totalContracts = filteredContracts.length
    const totalAdvances = d.advances.reduce((acc, a) => acc + Number(a.amount || 0), 0)
    const outstandingBalance = totalDriverAllocation - totalAdvances

    const avgRevenuePerKm = totalKm > 0 ? totalRevenue / totalKm : null

    return {
      id: d.id,
      driverCode: d.driverCode,
      name: d.name,
      phone: d.phone,
      licenseType: d.licenseType,
      status: d.status,
      totalContracts,
      totalKm,
      totalRevenue,
      totalDriverAllocation,
      avgRevenuePerKm,
      outstandingBalance,
    }
  })

  // Sort by totalRevenue DESC by default
  driverStats.sort((a, b) => b.totalRevenue - a.totalRevenue)

  // Attach Rank Badges
  return driverStats.map((stat, index) => {
    let rankBadge = `${index + 1}`
    if (index === 0) rankBadge = '🥇 Rank 1'
    else if (index === 1) rankBadge = '🥈 Rank 2'
    else if (index === 2) rankBadge = '🥉 Rank 3'

    return {
      ...stat,
      rank: index + 1,
      rankBadge,
    }
  })
}

// ----------------------------------------------------
// 4. LICENSE EXPIRATION ENGINE
// ----------------------------------------------------

export async function checkDriverLicenseExpirationsAction() {
  const drivers = await prisma.driver.findMany({
    where: { status: 'ACTIVE' },
  })

  const now = new Date()
  const notificationsCreated: string[] = []

  for (const d of drivers) {
    if (!d.licenseExpiry) continue

    const diffDays = Math.ceil((d.licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      // EXPIRED Notification
      const title = `SIM Pengemudi EXPIRED: ${d.name} (${d.driverCode})`
      const message = `Masa berlaku ${d.licenseType || 'SIM'} pengemudi ${d.name} telah habis pada ${d.licenseExpiry.toLocaleDateString('id-ID')}. Mohon perbarui dokumen pengemudi.`

      // Check existing unread notification
      const existing = await prisma.notification.findFirst({
        where: {
          title,
          isRead: false,
        },
      })

      if (!existing) {
        const owners = await prisma.user.findMany({ where: { role: 'OWNER' } })
        for (const owner of owners) {
          await prisma.notification.create({
            data: {
              userId: owner.id,
              category: 'DOCUMENT',
              severity: 'CRITICAL',
              title,
              message,
              link: `/drivers/${d.id}`,
            },
          })
        }
        notificationsCreated.push(d.id)
      }
    } else if (diffDays <= 30) {
      // EXPIRING SOON Notification
      const title = `SIM Pengemudi Segera Expired: ${d.name}`
      const message = `Masa berlaku ${d.licenseType || 'SIM'} pengemudi ${d.name} tersisa ${diffDays} hari (Habis: ${d.licenseExpiry.toLocaleDateString('id-ID')}).`

      const existing = await prisma.notification.findFirst({
        where: {
          title,
          isRead: false,
        },
      })

      if (!existing) {
        const owners = await prisma.user.findMany({ where: { role: 'OWNER' } })
        for (const owner of owners) {
          await prisma.notification.create({
            data: {
              userId: owner.id,
              category: 'DOCUMENT',
              severity: 'WARNING',
              title,
              message,
              link: `/drivers/${d.id}`,
            },
          })
        }
        notificationsCreated.push(d.id)
      }
    }
  }

  return { checkedCount: drivers.length, alertsEmitted: notificationsCreated.length }
}
