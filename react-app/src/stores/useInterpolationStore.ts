import { create } from 'zustand'

import type {
  InterpolationConfig,
  InterpolationLegendSettings,
  InterpolationState,
} from '@/features/interpolation'

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
    out.idwPower = clamp(out.idwPower, 0.1, 10, current.idwPower)
  }
  if (out.cellWidth !== undefined) {
    out.cellWidth = clamp(out.cellWidth, 0.1, 1000, current.cellWidth)
  }
  if (out.classCount !== undefined) {
    out.classCount = Math.round(clamp(out.classCount, 3, 15, current.classCount))
  }
  if (out.krigingSigma2 !== undefined) {
    out.krigingSigma2 = clamp(out.krigingSigma2, 0, 1e6, current.krigingSigma2)
  }
  if (out.krigingAlpha !== undefined) {
    out.krigingAlpha = clamp(out.krigingAlpha, 0.01, 1e6, current.krigingAlpha)
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
