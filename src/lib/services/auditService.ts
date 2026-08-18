import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function createAuditLog(params: {
  action: string
  module: string
  recordId?: string
  beforeValue?: unknown
  afterValue?: unknown
}) {
  try {
    const session = await getSession()
    if (!session) return

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.userId },
          ...(session.email ? [{ email: session.email }] : []),
          ...(session.role ? [{ role: session.role }] : []),
        ],
      },
    })
    if (!user) return

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name || session.name,
        role: user.role || session.role,
        action: params.action,
        module: params.module,
        recordId: params.recordId ?? null,
        beforeValue: params.beforeValue ? JSON.stringify(params.beforeValue) : null,
        afterValue: params.afterValue ? JSON.stringify(params.afterValue) : null,
      },
    })
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}
