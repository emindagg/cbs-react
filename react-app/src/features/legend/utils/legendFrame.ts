import type { LegendConfiguration } from '@/types/visualization'

export function getLegendFrameClass(config: LegendConfiguration) {
  return config.showFrame === false
    ? 'rounded-none'
    : 'bg-white border border-black rounded-none'
}
