'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export interface GetPiutangParams {
  customerId?: string
  status?: string
  search?: string
}

export async function getPiutangContractsAction(params?: GetPiutangParams) {
  await requireAuth()

  const whereClause: any = {}

  if (params?.customerId && params.customerId !== 'ALL') {
    whereClause.customerId = params.customerId
  }

  if (params?.search && params.search.trim()) {
    const q = params.search.trim()
    whereClause.OR = [
      { contractNumber: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { truck: { policeNumber: { contains: q, mode: 'insensitive' } } },
      { driverName: { contains: q, mode: 'insensitive' } },
    ]
  }

  const allContracts = await prisma.tripContract.findMany({
    where: whereClause,
    include: {
      customer: true,
      truck: true,
      legs: {
        include: { customer: true },
        orderBy: { legNumber: 'asc' },
      },
      financialTransactions: {
        orderBy: { date: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  let totalPiutangOutstanding = 0
  let totalPaidAmount = 0
  let totalRevenueAll = 0
  let unpaidCount = 0
  let partialCount = 0
  let paidCount = 0

  const processedContracts = allContracts.map((c: any) => {
    let totalRevenue = 0
    for (const leg of c.legs) {
      if (leg.contractValue) totalRevenue += Number(leg.contractValue)
    }

    const paidAmount = Number(c.paidAmount || 0)
    const remainingPiutang = Math.max(0, totalRevenue - paidAmount)
    
    // Auto-resolve paymentStatus if needed
    let paymentStatus = c.paymentStatus
    if (!paymentStatus) {
      if (paidAmount >= totalRevenue && totalRevenue > 0) paymentStatus = 'PAID'
      else if (paidAmount > 0) paymentStatus = 'PARTIAL'
      else paymentStatus = 'UNPAID'
    }

    totalRevenueAll += totalRevenue
    totalPaidAmount += paidAmount
    if (remainingPiutang > 0) {
      totalPiutangOutstanding += remainingPiutang
    }

    if (paymentStatus === 'PAID') paidCount++
    else if (paymentStatus === 'PARTIAL') partialCount++
    else unpaidCount++

    return {
      ...c,
      totalRevenue,
      paidAmount,
      remainingPiutang,
      paymentStatus,
    }
  })

  // Apply Status Filter if specified
  let filteredContracts = processedContracts
  if (params?.status && params.status !== 'ALL') {
    if (params.status === 'ALL_PIUTANG') {
      filteredContracts = processedContracts.filter((c: any) => c.remainingPiutang > 0)
    } else {
      filteredContracts = processedContracts.filter((c: any) => c.paymentStatus === params.status)
    }
  }

  return {
    contracts: JSON.parse(JSON.stringify(filteredContracts)),
    summary: {
      totalPiutangOutstanding,
      totalPaidAmount,
      totalRevenueAll,
      unpaidCount,
      partialCount,
      paidCount,
      totalContracts: processedContracts.length,
    },
  }
}
