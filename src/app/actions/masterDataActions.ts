'use server'

import { prisma } from '@/lib/prisma'
import { requireFinanceOrOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export async function createCustomerAction(input: {
  code: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}) {
  await requireFinanceOrOwner()

  if (!input.code || !input.name) {
    return { error: 'Kode dan Nama Customer wajib diisi.' }
  }

  const existing = await prisma.customer.findUnique({ where: { code: input.code } })
  if (existing) {
    return { error: `Kode Customer "${input.code}" sudah ada.` }
  }

  const customer = await prisma.customer.create({
    data: {
      code: input.code,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      notes: input.notes || null,
    },
  })

  await createAuditLog({
    action: 'CREATE_CUSTOMER',
    module: 'MASTER_DATA',
    recordId: customer.id,
    afterValue: customer,
  })

  revalidatePath('/master-data')
  revalidatePath('/customers')
  return { success: true, customer }
}

export async function getCustomersAction() {
  await requireAuth()
  return await prisma.customer.findMany({ orderBy: { name: 'asc' } })
}

export async function getSparepartCategoriesAction() {
  await requireAuth()
  return await prisma.sparepartCategory.findMany({ orderBy: { name: 'asc' } })
}

export async function getIncomeCategoriesAction() {
  await requireAuth()
  return await prisma.incomeCategory.findMany({ orderBy: { name: 'asc' } })
}

export async function getExpenseCategoriesAction() {
  await requireAuth()
  return await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } })
}
