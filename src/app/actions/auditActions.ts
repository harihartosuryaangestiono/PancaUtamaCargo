'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/session'

export interface AuditLogFilterInput {
  userId?: string
  action?: string
  module?: string
  search?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export async function getAuditLogsAction(filters: AuditLogFilterInput = {}) {
  // Strict Server-Side RBAC Enforcement: OWNER ONLY
  // If user is FINANCE, requireOwner throws error (which caller catches or receives 403)
  const session = await requireOwner()

  const page = filters.page || 1
  const pageSize = filters.pageSize || 25
  const skip = (page - 1) * pageSize

  const where: any = {}

  if (filters.userId) where.userId = filters.userId
  if (filters.action) where.action = filters.action
  if (filters.module) where.module = filters.module

  if (filters.search) {
    where.OR = [
      { userName: { contains: filters.search, mode: 'insensitive' } },
      { action: { contains: filters.search, mode: 'insensitive' } },
      { module: { contains: filters.search, mode: 'insensitive' } },
      { recordId: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  }
}
