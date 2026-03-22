export type HeatmapColorStop = [number, string]

export interface HeatmapConfig {
  radius: number
  intensity: number
  opacity: number
  minDensityRatio: number
  weightField: string | null
  colorStops: HeatmapColorStop[]
}

export type HeatmapPreset =
  | 'classic'
  | 'inferno'
  | 'viridis'
  | 'magma'
  | 'warm'
  | 'cool'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'monochrome'
  | 'heatmap1'

export interface HeatmapStore {
  isActive: boolean
  config: HeatmapConfig
  activePreset: HeatmapPreset
  isPanelOpen: boolean

  toggle: () => void
  activate: () => void
  deactivate: () => void
  setConfig: (config: Partial<HeatmapConfig>) => void
  setPanelOpen: (open: boolean) => void
  applyPreset: (preset: HeatmapPreset) => void
  reset: () => void
}
