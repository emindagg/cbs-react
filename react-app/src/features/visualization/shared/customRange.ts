import type { CustomRange } from '@/types/visualization'

export type OutOfRangeMode = 'gray' | 'transparent'

export interface ResolvedCustomRange {
  enabled: true
  min: number
  max: number
  outOfRangeMode: OutOfRangeMode
}

export function resolveCustomRange(
  customRange: CustomRange | undefined,
  values: number[],
): ResolvedCustomRange | null {
  if (!customRange?.enabled || values.length === 0) return null

  const autoMin = Math.min(...values)
  const autoMax = Math.max(...values)
  const min = customRange.min ?? autoMin
  const max = customRange.max ?? autoMax

  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return null

  return {
    enabled: true,
    min,
    max,
    outOfRangeMode: customRange.outOfRangeMode ?? 'gray',
  }
}

export function clampToCustomRange(value: number, range: ResolvedCustomRange | null): number {
  if (!range) return value
  return Math.max(range.min, Math.min(range.max, value))
}

export function isValueInCustomRange(value: number, range: ResolvedCustomRange | null): boolean {
  if (!range) return true
  return value >= range.min && value <= range.max
}
