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
  if (!customRange?.enabled) return null

  // NaN/Infinity değerleri autoMin/autoMax'ı bozar; büyük dizilerde `Math.min(...values)`
  // call stack limitine takılabilir. Tek geçişte güvenli min/max hesabı yapıyoruz.
  let autoMin = Infinity
  let autoMax = -Infinity
  for (const v of values) {
    if (!Number.isFinite(v)) continue
    if (v < autoMin) autoMin = v
    if (v > autoMax) autoMax = v
  }
  const hasAutoBounds = autoMin !== Infinity && autoMax !== -Infinity

  const min = customRange.min ?? (hasAutoBounds ? autoMin : NaN)
  const max = customRange.max ?? (hasAutoBounds ? autoMax : NaN)

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
