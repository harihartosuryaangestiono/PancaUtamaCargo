import { Prisma } from '@prisma/client'

/**
 * Format currency strictly adhering to financial NULL rule:
 * If value is NULL or undefined, returns "Not recorded".
 * Only returns "Rp 0" if the value is explicitly zero.
 */
export function formatCurrency(
  value: number | Prisma.Decimal | null | undefined
): string {
  if (value === null || value === undefined) {
    return 'Not recorded'
  }

  const numValue = typeof value === 'object' && 'toNumber' in value 
    ? value.toNumber() 
    : Number(value)

  if (isNaN(numValue)) {
    return 'Not recorded'
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(numValue)
    .replace(/\u00A0/g, ' ')
}

/**
 * Format distance in kilometers (e.g., 60.000 KM)
 */
export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Not recorded'
  }
  return `${new Intl.NumberFormat('id-ID').format(value)} KM`
}

/**
 * Format percentage (e.g., 75.5%)
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0%'
  }
  return `${value.toFixed(1)}%`
}

/**
 * Format Date to Indonesian format (e.g., 17 Agu 2026)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Not recorded'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Not recorded'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
