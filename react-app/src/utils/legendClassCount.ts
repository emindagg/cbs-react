export const MIN_LEGEND_CLASSES = 3
export const MAX_LEGEND_CLASSES = 7

export const MIN_CUSTOM_BREAK_VALUES = MIN_LEGEND_CLASSES + 1
export const MAX_CUSTOM_BREAK_VALUES = MAX_LEGEND_CLASSES + 1

export function clampLegendClassCount(value: number): number {
  const safeValue = Number.isFinite(value) ? Math.round(value) : MIN_LEGEND_CLASSES
  return Math.max(MIN_LEGEND_CLASSES, Math.min(MAX_LEGEND_CLASSES, safeValue))
}

export function isValidCustomBreaksLength(length: number): boolean {
  return length >= MIN_CUSTOM_BREAK_VALUES && length <= MAX_CUSTOM_BREAK_VALUES
}

