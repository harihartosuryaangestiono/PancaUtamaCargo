'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export interface AppNotification {
  id: string
  category: 'TIRE' | 'DOCUMENT' | 'MAINTENANCE' | 'SPAREPART' | 'ODOMETER' | 'FUEL' | 'FINANCIAL' | 'SYSTEM'
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: Date
}

export async function getNotificationsAction(): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const session = await requireAuth()

  try {
    if (!(prisma as any).notification) {
      return { notifications: [], unreadCount: 0 }
    }

    // 1. Generate live dynamic alerts from real DB state
    await generateLiveSystemNotifications(session.userId)

    // 2. Fetch notifications for current user
    const dbNotifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: session.userId, isRead: false },
    })

    return {
      notifications: dbNotifications.map((n) => ({
        id: n.id,
        category: n.category as any,
        severity: n.severity as any,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    }
  } catch (err) {
    console.error('getNotificationsAction error:', err)
    return { notifications: [], unreadCount: 0 }
  }
}

export async function markNotificationAsReadAction(id: string) {
  const session = await requireAuth()
  if (!(prisma as any).notification) return { success: false }

  await prisma.notification.updateMany({
    where: { id, userId: session.userId },
    data: { isRead: true },
  })

  return { success: true }
}

export async function markAllNotificationsAsReadAction() {
  const session = await requireAuth()
  if (!(prisma as any).notification) return { success: false }

  await prisma.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  })

  return { success: true }
}

export async function clearReadNotificationsAction() {
  const session = await requireAuth()
  if (!(prisma as any).notification) return { success: false }

  await prisma.notification.deleteMany({
    where: { userId: session.userId, isRead: true },
  })

  return { success: true }
}

async function generateLiveSystemNotifications(userId: string) {
  if (!(prisma as any).notification) return

  const now = new Date()

  // A. Tire Alerts (Tires >= 90% lifetime used)
  const tires = await prisma.tire.findMany({
    where: { status: { in: ['ACTIVE', 'WARNING', 'CRITICAL', 'REPLACEMENT_DUE'] } },
  })

  for (const tire of tires) {
    const lifetimePercent = tire.expectedLifetimeKm > 0 ? (tire.currentKm / tire.expectedLifetimeKm) * 100 : 0
    if (lifetimePercent >= 90) {
      const title = `Peringatan Ban: ${tire.tireCode}`
      const message = `Ban ${tire.tireCode} (${tire.brand} ${tire.model}) telah mencapai ${Math.round(lifetimePercent)}% usia pakai. Rekomendasi pergantian segera.`
      await upsertNotification(userId, 'TIRE', 'CRITICAL', title, message, `/tires/${tire.id}`)
    }
  }

  // B. Document Expiry Alerts (Expiring within 30 days or expired)
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const docs = await prisma.truckDocument.findMany({
    where: {
      expiryDate: { lte: thirtyDaysLater },
    },
    include: { truck: true },
  })

  for (const doc of docs) {
    if (!doc.expiryDate) continue
    const daysLeft = Math.ceil((doc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isExpired = daysLeft <= 0
    const title = isExpired ? `Dokumen Kedaluwarsa: ${doc.docName}` : `Dokumen Segera Segera Kedaluwarsa`
    const message = isExpired
      ? `Dokumen ${doc.docName} untuk Truck ${doc.truck.policeNumber} telah kedaluwarsa!`
      : `Dokumen ${doc.docName} untuk Truck ${doc.truck.policeNumber} kedaluwarsa dalam ${daysLeft} hari.`
    const severity = isExpired ? 'CRITICAL' : 'WARNING'
    await upsertNotification(userId, 'DOCUMENT', severity, title, message, `/trucks/${doc.truckId}`)
  }

  // C. Maintenance Schedule Alerts
  const schedules = await prisma.maintenanceSchedule.findMany({
    include: { truck: true },
  })

  for (const sched of schedules) {
    if (sched.intervalKm && sched.lastServiceKm !== null && sched.lastServiceKm !== undefined) {
      const remainingKm = sched.lastServiceKm + sched.intervalKm - sched.truck.totalKm
      if (remainingKm <= 1000) {
        const isOverdue = remainingKm < 0
        const title = isOverdue ? `Maintenance Overdue: ${sched.serviceName}` : `Jadwal Maintenance Dekat`
        const message = isOverdue
          ? `Layanan ${sched.serviceName} untuk ${sched.truck.policeNumber} telah melebihi jadwal sebesar ${Math.abs(Math.round(remainingKm))} KM!`
          : `Layanan ${sched.serviceName} untuk ${sched.truck.policeNumber} jatuh tempo dalam ${Math.round(remainingKm)} KM.`
        const severity = isOverdue ? 'CRITICAL' : 'WARNING'
        await upsertNotification(userId, 'MAINTENANCE', severity, title, message, `/trucks/${sched.truckId}`)
      }
    }
  }

  // D. Sparepart Low Stock Alerts
  const lowStockParts = await prisma.sparepart.findMany({
    where: { status: 'ACTIVE' },
  })

  for (const part of lowStockParts) {
    if (part.currentStock <= part.minStock) {
      const title = `Stok Sparepart Menipis: ${part.name}`
      const message = `Stok ${part.name} (${part.partNumber}) tersisa ${part.currentStock} ${part.unit} (Min: ${part.minStock} ${part.unit}).`
      await upsertNotification(userId, 'SPAREPART', 'WARNING', title, message, '/spareparts')
    }
  }

  // E. Odometer Inactivity Alerts (No odometer update for 14+ days)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const inactiveTrucks = await prisma.truck.findMany({
    where: {
      status: 'ACTIVE',
      updatedAt: { lte: fourteenDaysAgo },
    },
  })

  for (const truck of inactiveTrucks) {
    const title = `Odometer Tidak Diperbarui`
    const message = `Truck ${truck.policeNumber} (${truck.truckCode}) belum memperbarui data odometer selama lebih dari 14 hari.`
    await upsertNotification(userId, 'ODOMETER', 'INFO', title, message, `/trucks/${truck.id}`)
  }
}

async function upsertNotification(
  userId: string,
  category: 'TIRE' | 'DOCUMENT' | 'MAINTENANCE' | 'SPAREPART' | 'ODOMETER' | 'FUEL' | 'FINANCIAL' | 'SYSTEM',
  severity: 'INFO' | 'WARNING' | 'CRITICAL',
  title: string,
  message: string,
  link?: string
) {
  if (!(prisma as any).notification) return

  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      category,
      title,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })

  if (!existing) {
    await prisma.notification.create({
      data: {
        userId,
        category,
        severity,
        title,
        message,
        link,
      },
    })
  }
}
