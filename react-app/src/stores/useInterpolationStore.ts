import { create } from 'zustand'

import type {
  InterpolationConfig,
  InterpolationLegendSettings,
  InterpolationState,
} from '@/features/interpolation'

const IDW_POWER_MIN = 0.1
const IDW_POWER_MAX = 10
const CELL_WIDTH_MIN = 0.1
const CELL_WIDTH_MAX = 1000
const CLASS_COUNT_MIN = 3
const CLASS_COUNT_MAX = 15
const KRIGING_SIGMA2_MAX = 1e6
const KRIGING_ALPHA_MIN = 0.01
const KRIGING_ALPHA_MAX = 1e6

const defaultConfig: InterpolationConfig = {
  method: 'idw',
  valueColumn: '',
  gridType: 'isoband',
  cellWidth: 10,
  idwPower: 2,
  krigingModel: 'exponential',
  krigingSigma2: 0,
  krigingAlpha: 100,
  classCount: 5,
  colorRamp: 'spectral',
  symbology: 'stretch',
  fillOpacity: 0.6,
  showPointValues: false,
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

// Sayısal konfig parametrelerini güvenli aralıklara sıkıştırır. UI bazen slider dışına
// çıkabiliyor veya program dışı değer gelebiliyor — negatif idwPower gibi matematiksel
// olarak ters sonuçlu değerleri engeller.
function sanitizeConfigPatch(
  partial: Partial<InterpolationConfig>,
  current: InterpolationConfig,
): Partial<InterpolationConfig> {
  const out: Partial<InterpolationConfig> = { ...partial }
  if (out.idwPower !== undefined) {
    out.idwPower = clamp(out.idwPower, IDW_POWER_MIN, IDW_POWER_MAX, current.idwPower)
  }
  if (out.cellWidth !== undefined) {
    out.cellWidth = clamp(out.cellWidth, CELL_WIDTH_MIN, CELL_WIDTH_MAX, current.cellWidth)
  }
  if (out.classCount !== undefined) {
    out.classCount = Math.round(clamp(out.classCount, CLASS_COUNT_MIN, CLASS_COUNT_MAX, current.classCount))
  }
  if (out.krigingSigma2 !== undefined) {
    out.krigingSigma2 = clamp(out.krigingSigma2, 0, KRIGING_SIGMA2_MAX, current.krigingSigma2)
  }
  if (out.krigingAlpha !== undefined) {
    out.krigingAlpha = clamp(out.krigingAlpha, KRIGING_ALPHA_MIN, KRIGING_ALPHA_MAX, current.krigingAlpha)
  }
  if (out.fillOpacity !== undefined) {
    out.fillOpacity = clamp(out.fillOpacity, 0, 1, current.fillOpacity)
  }
  return out
}

const defaultLegend: InterpolationLegendSettings = {
  title: null,
  position: null,
}

export const useInterpolationStore = create<InterpolationState>((set) => ({
  isActive: false,
  isPanelOpen: false,
  config: defaultConfig,
  result: null,
  isProcessing: false,
  error: null,
  legend: defaultLegend,

  activate: () => set({ isActive: true, isPanelOpen: true }),

  deactivate: () => set({
    isActive: false,
    isPanelOpen: false,
    result: null,
    error: null,
    isProcessing: false,
  }),

  toggle: () => set((state) => {
    if (state.isActive) {
      return { isActive: false, isPanelOpen: false, result: null, error: null, isProcessing: false }
    }
    return { isActive: true, isPanelOpen: true }
  }),

  setPanelOpen: (open) => set({ isPanelOpen: open }),

  setConfig: (partial) => set((state) => ({
    config: { ...state.config, ...sanitizeConfigPatch(partial, state.config) },
  })),

  setResult: (result) => set({ result }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  setError: (error) => set({ error }),

  setLegendTitle: (title) => set((state) => ({
    legend: { ...state.legend, title },
  })),

  setLegendPosition: (position) => set((state) => ({
    legend: { ...state.legend, position },
  })),

  reset: () => set({
    isActive: false,
    isPanelOpen: false,
    config: defaultConfig,
    result: null,
    isProcessing: false,
    error: null,
    legend: defaultLegend,
  }),
}))
