/**
 * Legend item generators for stepped and continuous scales
 */

import type { LegendConfiguration } from '@/types/visualization'
import { coerceNumberFormat, type NumberFormat } from '@/utils/numberFormatter'


export interface LegendItem {
  color: string
  label: string
}

export function generateSteppedItems(
  config: LegendConfiguration,
  colors: string[],
  breaks: number[],
  formatNumberFn: (value: number, format?: NumberFormat) => string,
): LegendItem[] {
  const items: LegendItem[] = []
  const legendFormat = coerceNumberFormat(config.format)

  if (config.labels.type === 'custom' && config.labels.customLabels) {
    for (let i = 0; i < colors.length; i++) {
      items.push({
        color: colors[i],
        label: config.labels.customLabels[i] || '',
      })
    }
  } else if (config.labels.type === 'ruler') {
    for (let i = 0; i < colors.length; i++) {
      const breakValue = breaks[i]
      if (breakValue !== undefined) {
        items.push({
          color: colors[i],
          label: formatNumberFn(breakValue, legendFormat),
        })
      }
    }
  } else {
    for (let i = 0; i < colors.length; i++) {
      const lower = breaks[i]
      const upper = breaks[i + 1]
      let label = ''
      if (lower !== undefined && upper !== undefined) {
        const lowerFormatted = formatNumberFn(lower, legendFormat)
        const upperFormatted = formatNumberFn(upper, legendFormat)
        label = `${lowerFormatted} - ${upperFormatted}`
      }
      items.push({ color: colors[i], label })
    }
  }

  return items
}

export function generateContinuousItems(
  config: LegendConfiguration,
  colors: string[],
  breaks: number[],
  formatNumberFn: (value: number, format?: NumberFormat) => string,
): LegendItem[] {
  const items: LegendItem[] = []
  const legendFormat = coerceNumberFormat(config.format)
  if (breaks.length < 2) return items

  const min = breaks[0]
  const max = breaks[breaks.length - 1]
  items.push({ color: colors[0], label: formatNumberFn(min, legendFormat) })
  items.push({ color: colors[colors.length - 1], label: formatNumberFn(max, legendFormat) })
  return items
}
