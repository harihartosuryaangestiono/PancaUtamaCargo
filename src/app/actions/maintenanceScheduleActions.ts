'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export interface CreateMaintenanceScheduleInput {
  truckId: string
  serviceName: string
  intervalKm?: number
  intervalDays?: number
  lastServiceKm?: number
  lastServiceDate?: string
}

export async function createMaintenanceScheduleAction(input: CreateMaintenanceScheduleInput) {
  await requireOwner()

  if (!input.truckId || !input.serviceName) {
    return { error: 'Truck ID dan Nama Layanan Servis wajib diisi.' }
  }

  const schedule = await prisma.maintenanceSchedule.create({
    data: {
      truckId: input.truckId,
      serviceName: input.serviceName,
      intervalKm: input.intervalKm ? Number(input.intervalKm) : null,
      intervalDays: input.intervalDays ? Number(input.intervalDays) : null,
      lastServiceKm: input.lastServiceKm ? Number(input.lastServiceKm) : null,
      lastServiceDate: input.lastServiceDate ? new Date(input.lastServiceDate) : null,
    },
  })

  await createAuditLog({
    action: 'CREATE_MAINTENANCE_SCHEDULE',
    module: 'MAINTENANCE_SCHEDULE',
    recordId: schedule.id,
    afterValue: schedule,
  })

  revalidatePath(`/trucks/${input.truckId}`)
  revalidatePath('/dashboard')
  revalidatePath('/maintenance')
  return { success: true, schedule }
}

export async function getMaintenanceSchedulesAction(truckId?: string) {
  await requireAuth()

  const whereClause = truckId ? { truckId } : {}
  const schedules = await prisma.maintenanceSchedule.findMany({
    where: whereClause,
    include: { truck: true },
    orderBy: { createdAt: 'desc' },
  })

  const now = Date.now()

  return schedules.map((sched: any) => {
    let kmStatus: 'UP_TO_DATE' | 'DUE_SOON' | 'DUE' | 'OVERDUE' = 'UP_TO_DATE'
    let dayStatus: 'UP_TO_DATE' | 'DUE_SOON' | 'DUE' | 'OVERDUE' = 'UP_TO_DATE'
    let remainingKm: number | null = null
    let remainingDays: number | null = null

    if (sched.intervalKm && sched.lastServiceKm !== null) {
      const targetKm = sched.lastServiceKm + sched.intervalKm
      remainingKm = targetKm - sched.truck.totalKm

      if (remainingKm < 0) {
        kmStatus = 'OVERDUE'
      } else if (remainingKm === 0) {
        kmStatus = 'DUE'
      } else if (remainingKm <= 1000) {
        kmStatus = 'DUE_SOON'
      }
    }

    if (sched.intervalDays && sched.lastServiceDate) {
      const targetTime = sched.lastServiceDate.getTime() + sched.intervalDays * 24 * 60 * 60 * 1000
      const diffMs = targetTime - now
      remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      if (remainingDays < 0) {
        dayStatus = 'OVERDUE'
      } else if (remainingDays === 0) {
        dayStatus = 'DUE'
      } else if (remainingDays <= 7) {
        dayStatus = 'DUE_SOON'
      }
    }

    // Determine overall status based on highest severity
    const statusPriority = { OVERDUE: 4, DUE: 3, DUE_SOON: 2, UP_TO_DATE: 1 }
    const overallScore = Math.max(statusPriority[kmStatus], statusPriority[dayStatus])

    let overallStatus: 'UP_TO_DATE' | 'DUE_SOON' | 'DUE' | 'OVERDUE' = 'UP_TO_DATE'
    if (overallScore === 4) overallStatus = 'OVERDUE'
    else if (overallScore === 3) overallStatus = 'DUE'
    else if (overallScore === 2) overallStatus = 'DUE_SOON'

    return {
      ...sched,
      remainingKm,
      remainingDays,
      status: overallStatus,
    }
  })
}
