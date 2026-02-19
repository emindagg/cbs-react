import {
  clampLegendClassCount,
  MAX_CUSTOM_BREAK_VALUES,
  MAX_LEGEND_CLASSES,
  MIN_CUSTOM_BREAK_VALUES,
  MIN_LEGEND_CLASSES,
  isValidCustomBreaksLength,
} from '@/utils/legendClassCount'

export {
  clampLegendClassCount,
  MAX_CUSTOM_BREAK_VALUES,
  MAX_LEGEND_CLASSES,
  MIN_CUSTOM_BREAK_VALUES,
  MIN_LEGEND_CLASSES,
  isValidCustomBreaksLength,
}

export const CLASS_COUNT_OPTIONS = Array.from(
  { length: MAX_LEGEND_CLASSES - MIN_LEGEND_CLASSES + 1 },
  (_, index) => MIN_LEGEND_CLASSES + index,
)
