import * as XLSX from 'xlsx'

export function formatExcelDate(val: any): string {
  if (val === null || val === undefined || val === '') return ''

  if (typeof val === 'number') {
    // Excel serial number e.g. 46239 -> 05/08/2026
    if (val > 10000 && val < 100000) {
      try {
        const parsed = XLSX.SSF.parse_date_code(val)
        if (parsed) {
          const day = String(parsed.d).padStart(2, '0')
          const month = String(parsed.m).padStart(2, '0')
          const year = parsed.y
          return `${day}/${month}/${year}`
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (typeof val === 'string') {
    const trimmed = val.trim()
    const num = Number(trimmed)
    if (!isNaN(num) && num > 10000 && num < 100000) {
      try {
        const parsed = XLSX.SSF.parse_date_code(num)
        if (parsed) {
          const day = String(parsed.d).padStart(2, '0')
          const month = String(parsed.m).padStart(2, '0')
          const year = parsed.y
          return `${day}/${month}/${year}`
        }
      } catch (e) {
        // ignore
      }
    }
    return trimmed
  }

  if (val instanceof Date) {
    const day = String(val.getDate()).padStart(2, '0')
    const month = String(val.getMonth() + 1).padStart(2, '0')
    const year = val.getFullYear()
    return `${day}/${month}/${year}`
  }

  return String(val).trim()
}

export function parseIndonesianNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val

  let str = String(val).trim()
  // Remove currency prefix like 'Rp', 'IDR', spaces, quotes
  str = str.replace(/Rp|IDR|'|"/gi, '').trim()
  if (!str) return 0

  // Handle formats:
  // Both '.' and ',' present
  if (str.includes('.') && str.includes(',')) {
    const lastDotIndex = str.lastIndexOf('.')
    const lastCommaIndex = str.lastIndexOf(',')
    if (lastCommaIndex > lastDotIndex) {
      // e.g. "500.000,00" (dot = thousand, comma = decimal)
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      // e.g. "500,000.00" (comma = thousand, dot = decimal)
      str = str.replace(/,/g, '')
    }
  } else if (str.includes(',')) {
    // Only comma present, e.g. "500,000" or "2,500" or "26,700,000" or "2,5"
    const parts = str.split(',')
    if (parts.length === 2 && parts[1].length <= 2 && parts[0].length <= 3) {
      // e.g. "2,5" (2.5) or "2,50" -> decimal comma
      str = str.replace(',', '.')
    } else {
      // "500,000" or "25,000" or "26,700,000" -> thousand separator comma
      str = str.replace(/,/g, '')
    }
  } else if (str.includes('.')) {
    // Only dot present, e.g. "500.000" or "500000.00" or "26.700.000"
    const parts = str.split('.')
    if (parts.length > 2) {
      // Multiple dots e.g. "26.700.000" -> thousand separators
      str = str.replace(/\./g, '')
    } else if (parts.length === 2) {
      // Single dot e.g. "500.000" (500k) vs "500000.00"
      if (parts[1].length === 3) {
        // e.g. "500.000" or "25.000" -> thousand separator!
        str = str.replace(/\./g, '')
      }
    }
  }

  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}
