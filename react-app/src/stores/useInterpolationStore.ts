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
    config: { ...state.config, ...partial },
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
