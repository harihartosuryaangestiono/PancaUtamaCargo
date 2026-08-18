'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireOwner } from '@/lib/session'

export interface MaintenanceScheduleItem {
  id: string
  truckId: string
  truckCode: string
  policeNumber: string
  serviceName: string
  intervalKm: number | null
  intervalDays: number | null
  lastServiceKm: number | null
  lastServiceDate: Date | null
  nextServiceKm: number | null
  nextServiceDate: Date | null
  remainingKm: number | null
  remainingDays: number | null
  status: 'UP_TO_DATE' | 'DUE_SOON' | 'DUE' | 'OVERDUE'
  createdAt: Date
}

export async function getMaintenanceSchedulesAction(truckId?: string): Promise<MaintenanceScheduleItem[]> {
  await requireAuth()

  const schedules = await prisma.maintenanceSchedule.findMany({
    where: truckId ? { truckId } : undefined,
    include: { truck: true },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()

  return schedules.map((sched) => {
    let nextServiceKm: number | null = null
    let remainingKm: number | null = null
    let nextServiceDate: Date | null = null
    let remainingDays: number | null = null

    if (sched.intervalKm !== null && sched.lastServiceKm !== null) {
      nextServiceKm = sched.lastServiceKm + sched.intervalKm
      remainingKm = nextServiceKm - sched.truck.totalKm
    }

    if (sched.intervalDays !== null && sched.lastServiceDate) {
      nextServiceDate = new Date(sched.lastServiceDate.getTime() + sched.intervalDays * 24 * 60 * 60 * 1000)
      remainingDays = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Determine status based on KM and Days urgency
    let status: 'UP_TO_DATE' | 'DUE_SOON' | 'DUE' | 'OVERDUE' = 'UP_TO_DATE'

    const kmOverdue = remainingKm !== null && remainingKm <= 0
    const daysOverdue = remainingDays !== null && remainingDays <= 0

    const kmDueSoon = remainingKm !== null && remainingKm <= 1000
    const daysDueSoon = remainingDays !== null && remainingDays <= 7

    if (kmOverdue || daysOverdue) {
      status = 'OVERDUE'
    } else if (remainingKm !== null && remainingKm <= 200) {
      status = 'DUE'
    } else if (kmDueSoon || daysDueSoon) {
      status = 'DUE_SOON'
    }

    return {
      id: sched.id,
      truckId: sched.truckId,
      truckCode: sched.truck.truckCode,
      policeNumber: sched.truck.policeNumber,
      serviceName: sched.serviceName,
      intervalKm: sched.intervalKm,
      intervalDays: sched.intervalDays,
      lastServiceKm: sched.lastServiceKm,
      lastServiceDate: sched.lastServiceDate,
      nextServiceKm,
      nextServiceDate,
      remainingKm,
      remainingDays,
      status,
      createdAt: sched.createdAt,
    }
  })
}

export async function createMaintenanceScheduleAction(data: {
  truckId: string
  serviceName: string
  intervalKm?: number | null
  intervalDays?: number | null
  lastServiceKm?: number | null
  lastServiceDate?: Date | null
}) {
  const session = await requireOwner()

  if (!data.truckId || !data.serviceName) {
    return { error: 'Truck dan nama service wajib diisi.' }
  }

  const truck = await prisma.truck.findUnique({ where: { id: data.truckId } })
  if (!truck) {
    return { error: 'Truck tidak ditemukan.' }
  }

  const schedule = await prisma.maintenanceSchedule.create({
    data: {
      truckId: data.truckId,
      serviceName: data.serviceName,
      intervalKm: data.intervalKm ? Number(data.intervalKm) : null,
      intervalDays: data.intervalDays ? Number(data.intervalDays) : null,
      lastServiceKm: data.lastServiceKm !== undefined && data.lastServiceKm !== null ? Number(data.lastServiceKm) : truck.totalKm,
      lastServiceDate: data.lastServiceDate ? new Date(data.lastServiceDate) : new Date(),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      userName: session.name,
      role: session.role,
      action: 'CREATE_MAINTENANCE_SCHEDULE',
      module: 'MAINTENANCE',
      recordId: schedule.id,
      afterValue: JSON.stringify({ serviceName: schedule.serviceName, truckId: schedule.truckId }),
    },
  })

  return { success: true, schedule }
}

export async function deleteMaintenanceScheduleAction(id: string) {
  const session = await requireOwner()

  await prisma.maintenanceSchedule.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      userName: session.name,
      role: session.role,
      action: 'DELETE_MAINTENANCE_SCHEDULE',
      module: 'MAINTENANCE',
      recordId: id,
    },
  })

  return { success: true }
}
