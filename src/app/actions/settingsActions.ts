'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export async function getCompanySettingsAction() {
  await requireAuth()
  const settings = await prisma.companySettings.findFirst()
  if (!settings) {
    throw new Error('SYSTEM_ERROR: CompanySettings record missing.')
  }
  return settings
}

export async function updateCompanySettingsAction(input: {
  companyName?: string
  defaultTireLifetimeKm?: number
  tireWarningPercent?: number
  tireCriticalPercent?: number
}) {
  try {
    await requireOwner()

    const current = await prisma.companySettings.findFirst()
    if (!current) {
      return { error: 'SYSTEM_ERROR: CompanySettings record missing.' }
    }

    const updated = await prisma.companySettings.update({
      where: { id: current.id },
      data: {
        companyName: input.companyName || current.companyName,
        defaultTireLifetimeKm: input.defaultTireLifetimeKm ? Number(input.defaultTireLifetimeKm) : current.defaultTireLifetimeKm,
        tireWarningPercent: input.tireWarningPercent ? Number(input.tireWarningPercent) : current.tireWarningPercent,
        tireCriticalPercent: input.tireCriticalPercent ? Number(input.tireCriticalPercent) : current.tireCriticalPercent,
      },
    })

    await createAuditLog({
      action: 'UPDATE_COMPANY_SETTINGS',
      module: 'SETTINGS',
      recordId: current.id,
      beforeValue: current,
      afterValue: updated,
    })

    revalidatePath('/settings')
    return { success: true, settings: updated, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memperbarui pengaturan'
    return { success: false, settings: null, error: errorMsg }
  }
}

export async function getAuditLogsAction() {
  await requireOwner()
  return await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function getUsersAction() {
  await requireOwner()
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: 'asc' },
  })
}

export async function changePasswordAction(input: {
  userId?: string
  newPassword: string
}) {
  const session = await requireAuth()

  // Only Owner can change passwords of other users; non-owners can only change their own password
  const targetUserId = input.userId || session.userId
  if (targetUserId !== session.userId && session.role !== 'OWNER') {
    return { error: 'Anda tidak memiliki hak akses untuk mengubah password pengguna lain.' }
  }

  if (!input.newPassword || input.newPassword.length < 6) {
    return { error: 'Password baru minimal 6 karakter.' }
  }

  const bcrypt = (await import('bcryptjs')).default
  const passwordHash = await bcrypt.hash(input.newPassword, 10)

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash },
  })

  await createAuditLog({
    action: 'CHANGE_PASSWORD',
    module: 'SECURITY',
    recordId: targetUserId,
  })

  return { success: true }
}
