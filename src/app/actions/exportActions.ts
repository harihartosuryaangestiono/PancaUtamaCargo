'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function exportDataCsvAction(type: 'financial' | 'shipment' | 'fuel' | 'maintenance' | 'tire' | 'sparepart' | 'fleet') {
  await requireAuth()

  if (type === 'financial') {
    const records = await prisma.financialTransaction.findMany({
      include: { incomeCategory: true, expenseCategory: true, customer: true },
      orderBy: { date: 'desc' },
    })

    const headers = ['Nomor Transaksi', 'Tipe', 'Tanggal', 'Kategori', 'Keterangan', 'Customer / Source', 'Nominal (Rp)', 'Metode']
    const rows = records.map((r: any) => [
      r.transactionNumber,
      r.type,
      new Date(r.date).toISOString().split('T')[0],
      r.type === 'INCOME' ? r.incomeCategory?.name ?? 'Umum' : r.expenseCategory?.name ?? 'Umum',
      `"${r.description.replace(/"/g, '""')}"`,
      `"${(r.customer?.name || r.purchaseSource || '-').replace(/"/g, '""')}"`,
      r.amount.toString(),
      r.paymentMethod,
    ])

    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  if (type === 'shipment') {
    const records = await prisma.shipment.findMany({
      include: { customer: true, truck: true },
      orderBy: { date: 'desc' },
    })

    const headers = ['Surat Jalan', 'Status', 'Tanggal', 'Customer', 'Truck', 'Asal', 'Tujuan', 'Driver', 'Total KM', 'Revenue', 'Total Cost', 'Net Revenue']
    const rows = records.map((r: any) => [
      r.shipmentNumber,
      r.status,
      new Date(r.date).toISOString().split('T')[0],
      `"${r.customer.name.replace(/"/g, '""')}"`,
      r.truck.policeNumber,
      `"${r.origin.replace(/"/g, '""')}"`,
      `"${r.destination.replace(/"/g, '""')}"`,
      `"${r.driverName.replace(/"/g, '""')}"`,
      r.totalKm.toString(),
      r.revenue?.toString() ?? '0',
      r.totalCost?.toString() ?? '0',
      r.netRevenue?.toString() ?? '0',
    ])

    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  if (type === 'fuel') {
    const records = await prisma.fuelLog.findMany({
      include: { truck: true },
      orderBy: { date: 'desc' },
    })

    const headers = ['Tanggal', 'Truck', 'Tank 1 (L)', 'Tank 2 (L)', 'Total Liter', 'Total Biaya (Rp)', 'KM Refuel', 'SPBU']
    const rows = records.map((r: any) => [
      new Date(r.date).toISOString().split('T')[0],
      r.truck.policeNumber,
      (r.tank1Liters ?? 0).toString(),
      (r.tank2Liters ?? 0).toString(),
      r.liter.toString(),
      r.totalCost?.toString() ?? '0',
      r.kmAtRefuel.toString(),
      `"${(r.gasStation || '-').replace(/"/g, '""')}"`,
    ])

    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  if (type === 'maintenance') {
    const records = await prisma.maintenance.findMany({
      include: { truck: true },
      orderBy: { date: 'desc' },
    })

    const headers = ['Nomor Maintenance', 'Tanggal', 'Truck', 'KM Truck', 'Tipe', 'Deskripsi', 'Labor Cost', 'Sparepart Cost', 'Other Cost', 'Total Cost']
    const rows = records.map((r: any) => [
      r.maintenanceNumber,
      new Date(r.date).toISOString().split('T')[0],
      r.truck.policeNumber,
      r.kmAtMaintenance.toString(),
      r.maintenanceType,
      `"${r.description.replace(/"/g, '""')}"`,
      r.laborCost?.toString() ?? '0',
      r.sparepartCost?.toString() ?? '0',
      r.otherCost?.toString() ?? '0',
      r.totalCost?.toString() ?? '0',
    ])

    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  if (type === 'tire') {
    const records = await prisma.tire.findMany({
      include: { currentPosition: { include: { truck: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const headers = ['Kode Ban', 'Brand', 'Model', 'Ukuran', 'Nomor Seri', 'Status', 'Posisi Saat Ini', 'Current KM', 'Expected Lifetime KM', 'Remaining KM']
    const rows = records.map((r: any) => [
      r.tireCode,
      r.brand,
      r.model,
      r.size,
      r.serialNumber,
      r.status,
      r.currentPosition ? `${r.currentPosition.truck.policeNumber} (${r.currentPosition.positionCode})` : 'Gudang Warehouse',
      r.currentKm.toString(),
      r.expectedLifetimeKm.toString(),
      r.remainingLifetimeKm.toString(),
    ])

    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  if (type === 'sparepart') {
    const records = await prisma.sparepart.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    })

    const headers = ['Part Number', 'Nama Sparepart', 'Kategori', 'Brand', 'Unit', 'Stok Saat Ini', 'Min Stok', 'Avg Price', 'Status']
    const rows = records.map((r: any) => [
      r.partNumber,
      `"${r.name.replace(/"/g, '""')}"`,
      r.category.name,
      r.brand || '-',
      r.unit,
      r.currentStock.toString(),
      r.minStock.toString(),
      r.avgPurchasePrice?.toString() ?? '0',
      r.status,
    ])

    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  // Default: Fleet performance
  const trucks = await prisma.truck.findMany({
    include: { shipments: true, maintenances: true, fuelLogs: true },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['Truck Code', 'Nopol', 'Brand', 'Model', 'Status', 'Total KM', 'Total Shipments', 'Total Maintenances', 'Total Refuel Logs']
  const rows = trucks.map((t: any) => [
    t.truckCode,
    t.policeNumber,
    t.brand,
    t.model,
    t.status,
    t.totalKm.toString(),
    t.shipments.length.toString(),
    t.maintenances.length.toString(),
    t.fuelLogs.length.toString(),
  ])

  return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
}
