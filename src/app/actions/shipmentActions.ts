'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/session'
import { syncShipmentTires } from '@/lib/services/tireService'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export interface CreateShipmentInput {
  date: string
  customerId: string
  origin: string
  destination: string
  driverName: string
  truckId: string
  startKm: number
  endKm: number
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  revenue?: number
  fuelCost?: number
  tollCost?: number
  otherCost?: number
  notes?: string
}

export async function createShipmentAction(input: CreateShipmentInput) {
  await requireOwner()

  const startKm = Number(input.startKm)
  const endKm = Number(input.endKm)
  const status = input.status || 'COMPLETED'

  if (endKm < startKm) {
    return { error: 'Invalid odometer. End KM cannot be lower than Start KM.' }
  }

  if (!input.customerId || !input.truckId || !input.origin || !input.destination) {
    return { error: 'Customer, Truck, Asal, dan Tujuan wajib diisi.' }
  }

  const truck = await prisma.truck.findUnique({ where: { id: input.truckId } })
  if (!truck) return { error: 'Truck tidak ditemukan.' }

  if (status !== 'CANCELLED' && endKm < truck.totalKm) {
    return { error: `Invalid odometer. The entered KM (${endKm}) is lower than the truck's current odometer (${truck.totalKm}).` }
  }

  const totalKm = Math.max(0, endKm - startKm)

  const revNum = input.revenue !== undefined && input.revenue !== null && !isNaN(Number(input.revenue)) ? Number(input.revenue) : null
  const fuelNum = input.fuelCost !== undefined && input.fuelCost !== null && !isNaN(Number(input.fuelCost)) ? Number(input.fuelCost) : null
  const tollNum = input.tollCost !== undefined && input.tollCost !== null && !isNaN(Number(input.tollCost)) ? Number(input.tollCost) : null
  const otherNum = input.otherCost !== undefined && input.otherCost !== null && !isNaN(Number(input.otherCost)) ? Number(input.otherCost) : null

  let totalCostNum: number | null = null
  if (fuelNum !== null || tollNum !== null || otherNum !== null) {
    totalCostNum = (fuelNum ?? 0) + (tollNum ?? 0) + (otherNum ?? 0)
  }

  let netRevNum: number | null = null
  if (revNum !== null || totalCostNum !== null) {
    netRevNum = (revNum ?? 0) - (totalCostNum ?? 0)
  }

  const shipmentNumber = `SJ-${Date.now().toString().slice(-6)}`
  const user = await requireAuth()

  const result = await prisma.$transaction(
    async (tx: any) => {
      // 1. Create Shipment
      const shipment = await tx.shipment.create({
        data: {
          shipmentNumber,
          date: new Date(input.date || Date.now()),
          status,
          customerId: input.customerId,
          origin: input.origin,
          destination: input.destination,
          driverName: input.driverName || 'Driver Utama',
          truckId: input.truckId,
          startKm,
          endKm,
          totalKm,
          revenue: revNum !== null ? revNum : null,
          fuelCost: fuelNum !== null ? fuelNum : null,
          tollCost: tollNum !== null ? tollNum : null,
          otherCost: otherNum !== null ? otherNum : null,
          totalCost: totalCostNum !== null ? totalCostNum : null,
          netRevenue: netRevNum !== null ? netRevNum : null,
          notes: input.notes || null,
          createdById: user.userId,
        },
      })

      // Skip truck odometer & tire sync if shipment is CANCELLED
      if (status !== 'CANCELLED') {
        if (endKm > truck.totalKm) {
          await tx.truck.update({
            where: { id: input.truckId },
            data: { totalKm: endKm },
          })
        }

        await syncShipmentTires(input.truckId, startKm, endKm, 'ADD', tx)

        // Linked Financial Transactions for COMPLETED shipments
        if (revNum !== null && revNum > 0) {
          const incomeCategory = await tx.incomeCategory.findFirst({ where: { name: 'Hasil Pengiriman' } })
          await tx.financialTransaction.create({
            data: {
              transactionNumber: `TRX-INC-${Date.now().toString().slice(-6)}`,
              type: 'INCOME',
              date: shipment.date,
              incomeCategoryId: incomeCategory?.id || null,
              description: `Pendapatan Pengiriman ${shipmentNumber} (${input.origin} -> ${input.destination})`,
              customerId: input.customerId,
              shipmentId: shipment.id,
              amount: revNum,
              paymentMethod: 'TRANSFER',
              createdById: user.userId,
            },
          })
        }

        if (totalCostNum !== null && totalCostNum > 0) {
          const expenseCategory = await tx.expenseCategory.findFirst({ where: { name: 'Bahan Bakar' } })
          await tx.financialTransaction.create({
            data: {
              transactionNumber: `TRX-EXP-${Date.now().toString().slice(-6)}`,
              type: 'EXPENSE',
              date: shipment.date,
              expenseCategoryId: expenseCategory?.id || null,
              description: `Biaya Operasional Pengiriman ${shipmentNumber}`,
              shipmentId: shipment.id,
              amount: totalCostNum,
              paymentMethod: 'CASH',
              createdById: user.userId,
            },
          })
        }
      }

      return shipment
    },
    { maxWait: 10000, timeout: 30000 }
  )

  await createAuditLog({
    action: 'CREATE_SHIPMENT',
    module: 'SHIPMENT',
    recordId: result.id,
    afterValue: result,
  })

  revalidatePath('/shipments')
  revalidatePath('/trucks')
  revalidatePath('/dashboard')
  return { success: true, shipment: result }
}

export async function updateShipmentAction(input: {
  id: string
  date?: string
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  customerId?: string
  origin?: string
  destination?: string
  driverName?: string
  startKm?: number
  endKm?: number
  revenue?: number
  fuelCost?: number
  tollCost?: number
  otherCost?: number
  notes?: string
}) {
  await requireOwner()

  return await prisma.$transaction(async (tx: any) => {
    const oldShipment = await tx.shipment.findUnique({
      where: { id: input.id },
    })

    if (!oldShipment) {
      throw new Error('Pengiriman tidak ditemukan.')
    }

    const startKm = input.startKm !== undefined ? Number(input.startKm) : oldShipment.startKm
    const endKm = input.endKm !== undefined ? Number(input.endKm) : oldShipment.endKm
    const newStatus = input.status || oldShipment.status

    if (endKm < startKm) {
      throw new Error('Invalid odometer. End KM cannot be lower than Start KM.')
    }

    const totalKm = Math.max(0, endKm - startKm)

    const revNum = input.revenue !== undefined ? (input.revenue !== null && !isNaN(Number(input.revenue)) ? Number(input.revenue) : null) : (oldShipment.revenue ? Number(oldShipment.revenue) : null)
    const fuelNum = input.fuelCost !== undefined ? (input.fuelCost !== null && !isNaN(Number(input.fuelCost)) ? Number(input.fuelCost) : null) : (oldShipment.fuelCost ? Number(oldShipment.fuelCost) : null)
    const tollNum = input.tollCost !== undefined ? (input.tollCost !== null && !isNaN(Number(input.tollCost)) ? Number(input.tollCost) : null) : (oldShipment.tollCost ? Number(oldShipment.tollCost) : null)
    const otherNum = input.otherCost !== undefined ? (input.otherCost !== null && !isNaN(Number(input.otherCost)) ? Number(input.otherCost) : null) : (oldShipment.otherCost ? Number(oldShipment.otherCost) : null)

    let totalCostNum: number | null = null
    if (fuelNum !== null || tollNum !== null || otherNum !== null) {
      totalCostNum = (fuelNum ?? 0) + (tollNum ?? 0) + (otherNum ?? 0)
    }

    let netRevNum: number | null = null
    if (revNum !== null || totalCostNum !== null) {
      netRevNum = (revNum ?? 0) - (totalCostNum ?? 0)
    }

    // Reverse old financial transactions
    await tx.financialTransaction.deleteMany({
      where: { shipmentId: input.id },
    })

    const updatedShipment = await tx.shipment.update({
      where: { id: input.id },
      data: {
        date: input.date ? new Date(input.date) : oldShipment.date,
        status: newStatus,
        customerId: input.customerId || oldShipment.customerId,
        origin: input.origin || oldShipment.origin,
        destination: input.destination || oldShipment.destination,
        driverName: input.driverName || oldShipment.driverName,
        startKm,
        endKm,
        totalKm,
        revenue: revNum !== null ? revNum : null,
        fuelCost: fuelNum !== null ? fuelNum : null,
        tollCost: tollNum !== null ? tollNum : null,
        otherCost: otherNum !== null ? otherNum : null,
        totalCost: totalCostNum !== null ? totalCostNum : null,
        netRevenue: netRevNum !== null ? netRevNum : null,
        notes: input.notes !== undefined ? input.notes : oldShipment.notes,
      },
    })

    if (oldShipment.status !== 'CANCELLED') {
      await syncShipmentTires(oldShipment.truckId, oldShipment.startKm, oldShipment.endKm, 'REMOVE', tx)
    }

    if (newStatus !== 'CANCELLED') {
      const truck = await tx.truck.findUnique({ where: { id: oldShipment.truckId } })
      if (truck && endKm > truck.totalKm) {
        await tx.truck.update({
          where: { id: oldShipment.truckId },
          data: { totalKm: endKm },
        })
      }

      await syncShipmentTires(oldShipment.truckId, startKm, endKm, 'ADD', tx)

      const user = await requireAuth()
      if (revNum !== null && revNum > 0) {
        const incomeCategory = await tx.incomeCategory.findFirst({ where: { name: 'Hasil Pengiriman' } })
        await tx.financialTransaction.create({
          data: {
            transactionNumber: `TRX-INC-${Date.now().toString().slice(-6)}`,
            type: 'INCOME',
            date: updatedShipment.date,
            incomeCategoryId: incomeCategory?.id || null,
            description: `Pendapatan Pengiriman ${updatedShipment.shipmentNumber} (${updatedShipment.origin} -> ${updatedShipment.destination})`,
            customerId: updatedShipment.customerId,
            shipmentId: updatedShipment.id,
            amount: revNum,
            paymentMethod: 'TRANSFER',
            createdById: user.userId,
          },
        })
      }

      if (totalCostNum !== null && totalCostNum > 0) {
        const expenseCategory = await tx.expenseCategory.findFirst({ where: { name: 'Bahan Bakar' } })
        await tx.financialTransaction.create({
          data: {
            transactionNumber: `TRX-EXP-${Date.now().toString().slice(-6)}`,
            type: 'EXPENSE',
            date: updatedShipment.date,
            expenseCategoryId: expenseCategory?.id || null,
            description: `Biaya Operasional Pengiriman ${updatedShipment.shipmentNumber}`,
            shipmentId: updatedShipment.id,
            amount: totalCostNum,
            paymentMethod: 'CASH',
            createdById: user.userId,
          },
        })
      }
    }

    await createAuditLog({
      action: 'UPDATE_SHIPMENT',
      module: 'SHIPMENT',
      recordId: input.id,
      beforeValue: oldShipment,
      afterValue: updatedShipment,
    })

    revalidatePath('/shipments')
    revalidatePath('/trucks')
    revalidatePath('/dashboard')
    return { success: true, shipment: updatedShipment }
  })
}

export async function getShipmentsAction() {
  await requireAuth()
  const shipments = await prisma.shipment.findMany({
    include: {
      customer: true,
      truck: true,
      createdBy: true,
    },
    orderBy: { date: 'desc' },
  })
  return JSON.parse(JSON.stringify(shipments))
}

export async function deleteShipmentAction(shipmentId: string) {
  await requireOwner()

  return await prisma.$transaction(async (tx: any) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: shipmentId },
    })

    if (!shipment) {
      throw new Error('Pengiriman tidak ditemukan.')
    }

    await tx.financialTransaction.deleteMany({
      where: { shipmentId: shipmentId },
    })

    await tx.shipment.delete({
      where: { id: shipmentId },
    })

    if (shipment.status !== 'CANCELLED') {
      await syncShipmentTires(shipment.truckId, shipment.startKm, shipment.endKm, 'REMOVE', tx)
    }

    await createAuditLog({
      action: 'DELETE_SHIPMENT',
      module: 'SHIPMENT',
      recordId: shipmentId,
      beforeValue: shipment,
    })

    revalidatePath('/shipments')
    revalidatePath('/trucks')
    revalidatePath('/dashboard')
    return { success: true }
  })
}

export async function getShipmentProfitabilityAction(shipmentId: string) {
  await requireAuth()

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { customer: true, truck: true },
  })

  if (!shipment) return null

  const revenue = shipment.revenue ? Number(shipment.revenue) : null
  const fuelCost = shipment.fuelCost ? Number(shipment.fuelCost) : 0
  const tollCost = shipment.tollCost ? Number(shipment.tollCost) : 0
  const otherCost = shipment.otherCost ? Number(shipment.otherCost) : 0
  const totalCost = shipment.totalCost ? Number(shipment.totalCost) : (fuelCost + tollCost + otherCost)

  const netProfit = revenue !== null ? revenue - totalCost : null
  const profitMargin = revenue !== null && revenue > 0 && netProfit !== null ? (netProfit / revenue) * 100 : null

  let status: 'HIGHLY PROFITABLE' | 'PROFITABLE' | 'LOW MARGIN' | 'LOSS' | 'NOT ENOUGH DATA' = 'NOT ENOUGH DATA'

  if (revenue !== null && netProfit !== null && profitMargin !== null) {
    if (netProfit < 0) status = 'LOSS'
    else if (profitMargin >= 30) status = 'HIGHLY PROFITABLE'
    else if (profitMargin >= 10) status = 'PROFITABLE'
    else status = 'LOW MARGIN'
  }

  const revPerKm = revenue !== null && shipment.totalKm > 0 ? revenue / shipment.totalKm : null
  const costPerKm = shipment.totalKm > 0 && totalCost > 0 ? totalCost / shipment.totalKm : null
  const profitPerKm = netProfit !== null && shipment.totalKm > 0 ? netProfit / shipment.totalKm : null

  return {
    shipmentId: shipment.id,
    shipmentNumber: shipment.shipmentNumber,
    customerName: shipment.customer.name,
    truckCode: shipment.truck.truckCode,
    totalKm: shipment.totalKm,
    revenue,
    fuelCost,
    tollCost,
    otherCost,
    totalCost,
    netProfit,
    profitMargin,
    revPerKm,
    costPerKm,
    profitPerKm,
    status,
  }
}

