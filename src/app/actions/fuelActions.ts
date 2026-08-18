'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireOwner } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

export interface CreateFuelLogInput {
  date: string
  truckId: string
  tank1Liters?: number
  tank2Liters?: number
  liter?: number
  pricePerLiter?: number
  totalCost?: number
  kmAtRefuel: number
  gasStation?: string
  notes?: string
}

export async function createFuelLogAction(input: CreateFuelLogInput) {
  const session = await requireAuth()

  if (!input.truckId || !input.kmAtRefuel) {
    return { error: 'Truck dan KM Odometer saat refuel wajib diisi.' }
  }

  const t1 = input.tank1Liters ? Number(input.tank1Liters) : 0
  const t2 = input.tank2Liters ? Number(input.tank2Liters) : 0
  const totalLiter = input.liter ? Number(input.liter) : t1 + t2

  if (totalLiter <= 0) {
    return { error: 'Jumlah liter pengisian BBM harus lebih dari 0.' }
  }

  const cost = input.totalCost
    ? Number(input.totalCost)
    : input.pricePerLiter
    ? totalLiter * Number(input.pricePerLiter)
    : null

  const fuel = await prisma.fuelLog.create({
    data: {
      date: new Date(input.date || Date.now()),
      truckId: input.truckId,
      tank1Liters: t1 > 0 ? t1 : null,
      tank2Liters: t2 > 0 ? t2 : null,
      liter: totalLiter,
      pricePerLiter: input.pricePerLiter ? new Prisma.Decimal(input.pricePerLiter) : null,
      totalCost: cost !== null ? new Prisma.Decimal(cost) : null,
      kmAtRefuel: Number(input.kmAtRefuel),
      gasStation: input.gasStation || null,
      notes: input.notes || null,
      createdById: session.userId,
    },
  })

  // Create audit log
  await createAuditLog({
    action: 'CREATE_FUEL_LOG',
    module: 'TRUCK',
    recordId: fuel.id,
    afterValue: fuel,
  })

  revalidatePath('/fuel')
  revalidatePath('/trucks')
  return { success: true, fuel }
}

export async function getFuelLogsAction(truckId?: string) {
  await requireAuth()

  return await prisma.fuelLog.findMany({
    where: truckId ? { truckId } : undefined,
    include: {
      truck: true,
      createdBy: true,
    },
    orderBy: { date: 'desc' },
  })
}

export async function getFuelIntelligenceAction(truckId: string) {
  await requireAuth()

  const logs = await prisma.fuelLog.findMany({
    where: { truckId },
    orderBy: { kmAtRefuel: 'asc' },
  })

  if (logs.length < 2) {
    return {
      status: 'NOT_ENOUGH_DATA',
      totalLiters: logs.reduce((acc, l) => acc + l.liter, 0),
      totalCost: logs.reduce((acc, l) => acc + (l.totalCost ? Number(l.totalCost) : 0), 0),
      totalDistance: 0,
      avgKmLiter: null,
      avgCostPerKm: null,
      currentKmLiter: null,
      diffPercent: null,
      efficiencyLabel: 'NOT ENOUGH DATA',
    }
  }

  const totalLiters = logs.reduce((acc, l) => acc + l.liter, 0)
  const totalCost = logs.reduce((acc, l) => acc + (l.totalCost ? Number(l.totalCost) : 0), 0)
  
  const firstKm = logs[0].kmAtRefuel
  const lastKm = logs[logs.length - 1].kmAtRefuel
  const totalDistance = Math.max(0, lastKm - firstKm)

  // Overall Historical Average KM/L (excluding first refuel)
  const refuelLitersSum = logs.slice(1).reduce((acc, l) => acc + l.liter, 0)
  const avgKmLiter = refuelLitersSum > 0 && totalDistance > 0 ? Number((totalDistance / refuelLitersSum).toFixed(2)) : null
  const avgCostPerKm = totalDistance > 0 && totalCost > 0 ? Math.round(totalCost / totalDistance) : null

  // Latest Refuel Efficiency
  const latestLog = logs[logs.length - 1]
  const prevLog = logs[logs.length - 2]
  const recentDist = Math.max(0, latestLog.kmAtRefuel - prevLog.kmAtRefuel)
  const currentKmLiter = recentDist > 0 && latestLog.liter > 0 ? Number((recentDist / latestLog.liter).toFixed(2)) : null

  let diffPercent: number | null = null
  let efficiencyLabel: 'EXCELLENT' | 'NORMAL' | 'UNUSUAL' | 'CRITICAL' | 'NOT ENOUGH DATA' = 'NORMAL'

  if (currentKmLiter !== null && avgKmLiter !== null && avgKmLiter > 0) {
    diffPercent = Number((((currentKmLiter - avgKmLiter) / avgKmLiter) * 100).toFixed(1))

    if (diffPercent >= 5) efficiencyLabel = 'EXCELLENT'
    else if (diffPercent >= -10) efficiencyLabel = 'NORMAL'
    else if (diffPercent >= -25) efficiencyLabel = 'UNUSUAL'
    else efficiencyLabel = 'CRITICAL'
  }

  return {
    status: 'CALCULATED',
    totalLiters,
    totalCost,
    totalDistance,
    avgKmLiter,
    avgCostPerKm,
    currentKmLiter,
    diffPercent,
    efficiencyLabel,
  }
}
