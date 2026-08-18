import { prisma } from '@/lib/prisma'
import { TireStatus, Prisma } from '@prisma/client'

/**
 * Loads company settings for tire lifetime thresholds.
 * Strictly throws validation error if CompanySettings cannot be loaded.
 */
export async function getCompanyTireSettings(tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma
  try {
    const settings = await db.companySettings.findFirst()
    if (settings) return settings
  } catch (err) {}
  return {
    defaultTireLifetimeKm: 80000,
    tireWarningPercent: 70,
    tireCriticalPercent: 90,
  }
}

/**
 * Calculates tire health status based on cumulative used KM and expected lifetime.
 */
export function calculateTireStatus(
  usedKm: number,
  expectedKm: number,
  warningPercent = 70,
  criticalPercent = 90
): TireStatus {
  if (expectedKm <= 0) return TireStatus.NEW
  const usagePercent = (usedKm / expectedKm) * 100

  if (usagePercent >= 100) {
    return TireStatus.REPLACEMENT_DUE
  }
  if (usagePercent >= criticalPercent) {
    return TireStatus.CRITICAL
  }
  if (usagePercent >= warningPercent) {
    return TireStatus.WARNING
  }
  return TireStatus.ACTIVE
}

/**
 * Recalculates total cumulative lifetime used KM for a given tire
 * across ALL historical and active installation periods.
 * MUST NOT reset mileage when a tire is moved or rotated.
 */
export async function recalculateTireKm(
  tireId: string,
  tx?: Prisma.TransactionClient,
  settingsParam?: any
): Promise<{ currentKm: number; remainingLifetimeKm: number; status: TireStatus }> {
  const db = tx ?? prisma
  const settings = settingsParam ?? (await getCompanyTireSettings(db))

  const tire = await db.tire.findUnique({
    where: { id: tireId },
    include: {
      installations: {
        include: {
          truck: true,
        },
      },
    },
  })

  if (!tire) {
    return { currentKm: 0, remainingLifetimeKm: 80000, status: TireStatus.NEW }
  }

  let totalUsedKm = 0

  for (const inst of tire.installations) {
    let periodUsage = 0

    if (inst.removedKm !== null && inst.removedKm !== undefined) {
      // Completed installation period
      periodUsage = Math.max(0, inst.removedKm - inst.installedKm)
    } else {
      // Currently active installation period on truck
      const currentTruckKm = inst.truck?.totalKm ?? inst.installedKm
      periodUsage = Math.max(0, currentTruckKm - inst.installedKm)
    }

    // Update actualUsedKm cache on installation record only if value actually changed
    if (inst.actualUsedKm !== periodUsage) {
      await db.tireInstallation.update({
        where: { id: inst.id },
        data: { actualUsedKm: periodUsage },
      }).catch(() => {})
    }

    totalUsedKm += periodUsage
  }

  const remainingKm = Math.max(0, tire.expectedLifetimeKm - totalUsedKm)
  let status = tire.status

  // Only auto-update status if tire is not in a terminal condition like REPLACED/DAMAGED/RETIRED
  if (
    tire.status === TireStatus.NEW ||
    tire.status === TireStatus.ACTIVE ||
    tire.status === TireStatus.WARNING ||
    tire.status === TireStatus.CRITICAL ||
    tire.status === TireStatus.REPLACEMENT_DUE
  ) {
    status = calculateTireStatus(
      totalUsedKm,
      tire.expectedLifetimeKm,
      settings.tireWarningPercent ?? 70,
      settings.tireCriticalPercent ?? 90
    )
  }

  // Update cached properties on Tire record if changed
  if (
    tire.currentKm !== totalUsedKm ||
    tire.remainingLifetimeKm !== remainingKm ||
    tire.status !== status
  ) {
    await db.tire.update({
      where: { id: tireId },
      data: {
        currentKm: totalUsedKm,
        remainingLifetimeKm: remainingKm,
        status: status,
      },
    }).catch(() => {})
  }

  return {
    currentKm: totalUsedKm,
    remainingLifetimeKm: remainingKm,
    status: status,
  }
}

/**
 * Resolves which tires were installed on a truck during a historical shipment
 * (startKm to endKm) and updates their usage cumulatively.
 */
export async function syncShipmentTires(
  truckId: string,
  startKm: number,
  endKm: number,
  action: 'ADD' | 'REMOVE',
  tx: Prisma.TransactionClient
) {
  const distance = Math.max(0, endKm - startKm)
  if (distance === 0) return

  const settings = await getCompanyTireSettings(tx)

  // Find installations that overlap with [startKm, endKm]
  const installations = await tx.tireInstallation.findMany({
    where: {
      truckId: truckId,
      installedKm: { lte: endKm },
      OR: [
        { removedKm: null },
        { removedKm: { gte: startKm } },
      ],
    },
    include: {
      tire: true,
    },
  })

  await Promise.all(installations.map((inst) => recalculateTireKm(inst.tireId, tx, settings)))
}
