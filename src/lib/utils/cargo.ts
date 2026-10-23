export const CARGO_WEIGHT_UNITS = [
  { value: 'PCS', label: 'pcs' },
  { value: 'PALET', label: 'palet' },
  { value: 'TON', label: 'ton' },
] as const

export type CargoWeightUnit = (typeof CARGO_WEIGHT_UNITS)[number]['value']

export function isCargoWeightUnit(value: unknown): value is CargoWeightUnit {
  return CARGO_WEIGHT_UNITS.some((unit) => unit.value === value)
}

export function formatCargoWeight(weight: number | null | undefined, unit?: string | null) {
  const label = CARGO_WEIGHT_UNITS.find((option) => option.value === unit)?.label ?? unit?.toLowerCase() ?? 'ton'
  return `${weight ?? 0} ${label}`
}
