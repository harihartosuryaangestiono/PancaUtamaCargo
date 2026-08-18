'use server'

import { prisma } from '@/lib/prisma'
import { requireFinanceOrOwner, requireOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export interface CustomerInput {
  code: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export async function createCustomerAction(input: CustomerInput) {
  await requireFinanceOrOwner()

  if (!input.code || !input.name) {
    return { error: 'Kode Pelanggan dan Nama Pelanggan wajib diisi.' }
  }

  const existingCode = await prisma.customer.findUnique({
    where: { code: input.code },
  })
  if (existingCode) {
    return { error: `Kode Pelanggan "${input.code}" sudah terdaftar.` }
  }

  const customer = await prisma.customer.create({
    data: {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      notes: input.notes || null,
    },
  })

  await createAuditLog({
    action: 'CUSTOMER_CREATE',
    module: 'CUSTOMER',
    recordId: customer.id,
    afterValue: customer,
  })

  revalidatePath('/customers')
  return { success: true, customer }
}

export async function updateCustomerAction(id: string, input: Partial<CustomerInput>) {
  await requireFinanceOrOwner()

  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) {
    return { error: 'Data pelanggan tidak ditemukan.' }
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      name: input.name ? input.name.trim() : existing.name,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      email: input.email !== undefined ? input.email : existing.email,
      address: input.address !== undefined ? input.address : existing.address,
      notes: input.notes !== undefined ? input.notes : existing.notes,
    },
  })

  await createAuditLog({
    action: 'CUSTOMER_UPDATE',
    module: 'CUSTOMER',
    recordId: updated.id,
    beforeValue: existing,
    afterValue: updated,
  })

  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
  return { success: true, customer: updated }
}

export async function deleteCustomerAction(id: string) {
  await requireOwner()

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          shipments: true,
          incomes: true,
        },
      },
    },
  })

  if (!customer) {
    return { error: 'Data pelanggan tidak ditemukan.' }
  }

  if (customer._count.shipments > 0 || customer._count.incomes > 0) {
    return {
      error: `Tidak dapat menghapus pelanggan "${customer.name}" karena memiliki ${customer._count.shipments} riwayat pengiriman dan ${customer._count.incomes} transaksi keuangan.`,
    }
  }

  await prisma.customer.delete({ where: { id } })

  await createAuditLog({
    action: 'CUSTOMER_DELETE',
    module: 'CUSTOMER',
    recordId: id,
    beforeValue: customer,
  })

  revalidatePath('/customers')
  return { success: true }
}

export async function getCustomersAction() {
  await requireAuth()
  return await prisma.customer.findMany({
    include: {
      _count: {
        select: { shipments: true, incomes: true, tripContracts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCustomerByIdAction(id: string) {
  await requireAuth()
  return await prisma.customer.findUnique({
    where: { id },
    include: {
      shipments: {
        include: { truck: true },
        orderBy: { date: 'desc' },
      },
      tripContracts: {
        include: { truck: true, driver: true, legs: true },
        orderBy: { startDate: 'desc' },
      },
      incomes: {
        orderBy: { date: 'desc' },
      },
    },
  })
}

export async function getCustomerIntelligenceAction(dateRange: string = 'ALL_TIME') {
  await requireAuth()

  const now = new Date()
  let gteDate: Date | null = null

  if (dateRange === 'TODAY') {
    gteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (dateRange === 'THIS_WEEK') {
    const day = now.getDay()
    gteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
  } else if (dateRange === 'THIS_MONTH') {
    gteDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (dateRange === 'LAST_MONTH') {
    gteDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  } else if (dateRange === 'LAST_3_MONTHS') {
    gteDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  } else if (dateRange === 'THIS_YEAR') {
    gteDate = new Date(now.getFullYear(), 0, 1)
  }

  const customers = await prisma.customer.findMany({
    include: {
      shipments: {
        where: gteDate ? { date: { gte: gteDate } } : undefined,
      },
      incomes: {
        where: gteDate ? { date: { gte: gteDate } } : undefined,
      },
    },
  })

  const intelligence = customers.map((c) => {
    const totalShipments = c.shipments.length
    const totalRevenue = c.shipments.reduce((acc, s) => acc + (s.revenue ? Number(s.revenue) : 0), 0)
    const totalDistance = c.shipments.reduce((acc, s) => acc + s.totalKm, 0)
    const totalCost = c.shipments.reduce((acc, s) => acc + (s.totalCost ? Number(s.totalCost) : 0), 0)

    const totalProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null
    const avgRevPerShipment = totalShipments > 0 ? totalRevenue / totalShipments : null
    const avgRevPerKm = totalDistance > 0 ? totalRevenue / totalDistance : null

    return {
      id: c.id,
      code: c.code,
      name: c.name,
      phone: c.phone,
      email: c.email,
      totalShipments,
      totalRevenue,
      totalDistance,
      totalCost,
      totalProfit,
      profitMargin,
      avgRevPerShipment,
      avgRevPerKm,
    }
  })

  // Sort by revenue descending for top customer ranking
  const topByRevenue = [...intelligence].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const topByProfit = [...intelligence].sort((a, b) => b.totalProfit - a.totalProfit)
  const topByShipments = [...intelligence].sort((a, b) => b.totalShipments - a.totalShipments)

  return {
    allCustomers: intelligence,
    topByRevenue: topByRevenue.slice(0, 10),
    topByProfit: topByProfit.slice(0, 10),
    topByShipments: topByShipments.slice(0, 10),
  }
}

