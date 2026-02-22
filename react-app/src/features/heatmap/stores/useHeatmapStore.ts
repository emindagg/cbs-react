import { create } from 'zustand'

import type { HeatmapColorStop, HeatmapConfig, HeatmapPreset, HeatmapStore } from '../types'

const PRESETS: Record<HeatmapPreset, HeatmapColorStop[]> = {
  classic: [
    [0, 'rgba(33,102,172,0)'],
    [0.2, 'rgb(103,169,207)'],
    [0.4, 'rgb(209,229,240)'],
    [0.6, 'rgb(253,219,199)'],
    [0.8, 'rgb(239,138,98)'],
    [1, 'rgb(178,24,43)'],
  ],
  inferno: [
    [0, 'rgba(0,0,4,0)'],
    [0.2, 'rgb(40,11,84)'],
    [0.4, 'rgb(101,21,110)'],
    [0.6, 'rgb(186,54,85)'],
    [0.8, 'rgb(249,141,10)'],
    [1, 'rgb(252,255,164)'],
  ],
  viridis: [
    [0, 'rgba(68,1,84,0)'],
    [0.2, 'rgb(59,82,139)'],
    [0.4, 'rgb(33,145,140)'],
    [0.6, 'rgb(94,201,98)'],
    [0.8, 'rgb(189,223,38)'],
    [1, 'rgb(253,231,37)'],
  ],
  magma: [
    [0, 'rgba(0,0,4,0)'],
    [0.2, 'rgb(28,16,68)'],
    [0.4, 'rgb(79,18,123)'],
    [0.6, 'rgb(182,54,121)'],
    [0.8, 'rgb(251,136,97)'],
    [1, 'rgb(252,253,191)'],
  ],
  warm: [
    [0, 'rgba(0,0,0,0)'],
    [0.2, 'rgb(128,0,38)'],
    [0.4, 'rgb(189,0,38)'],
    [0.6, 'rgb(240,59,32)'],
    [0.8, 'rgb(253,141,60)'],
    [1, 'rgb(254,217,118)'],
  ],
  cool: [
    [0, 'rgba(0,0,0,0)'],
    [0.2, 'rgb(0,128,128)'],
    [0.4, 'rgb(0,200,200)'],
    [0.6, 'rgb(100,230,200)'],
    [0.8, 'rgb(180,255,180)'],
    [1, 'rgb(255,255,200)'],
  ],
  ocean: [
    [0, 'rgba(0,0,0,0)'],
    [0.2, 'rgb(0,32,76)'],
    [0.4, 'rgb(0,85,150)'],
    [0.6, 'rgb(30,144,200)'],
    [0.8, 'rgb(100,200,230)'],
    [1, 'rgb(200,240,255)'],
  ],
  forest: [
    [0, 'rgba(0,0,0,0)'],
    [0.2, 'rgb(0,48,14)'],
    [0.4, 'rgb(16,94,29)'],
    [0.6, 'rgb(49,163,84)'],
    [0.8, 'rgb(120,198,121)'],
    [1, 'rgb(217,240,163)'],
  ],
  sunset: [
    [0, 'rgba(0,0,0,0)'],
    [0.2, 'rgb(94,23,128)'],
    [0.4, 'rgb(171,55,100)'],
    [0.6, 'rgb(229,89,52)'],
    [0.8, 'rgb(253,167,0)'],
    [1, 'rgb(254,230,90)'],
  ],
  monochrome: [
    [0, 'rgba(0,0,0,0)'],
    [0.2, 'rgb(30,30,30)'],
    [0.4, 'rgb(80,80,80)'],
    [0.6, 'rgb(140,140,140)'],
    [0.8, 'rgb(200,200,200)'],
    [1, 'rgb(255,255,255)'],
  ],
}

export const HEATMAP_PRESETS = PRESETS

const defaultConfig: HeatmapConfig = {
  radius: 25,
  intensity: 1,
  opacity: 0.8,
  weightField: null,
  colorStops: PRESETS.classic,
}

export const useHeatmapStore = create<HeatmapStore>((set) => ({
  isActive: false,
  config: defaultConfig,
  activePreset: 'classic',
  isPanelOpen: false,

  toggle: () => set((state) => {
    const nextActive = !state.isActive
    return {
      isActive: nextActive,
      isPanelOpen: nextActive ? true : false,
    }
  }),

  activate: () => set({ isActive: true, isPanelOpen: true }),
  deactivate: () => set({ isActive: false, isPanelOpen: false }),

  setConfig: (partial) => set((state) => ({
    config: { ...state.config, ...partial },
  })),

  setPanelOpen: (open) => set({ isPanelOpen: open }),

  applyPreset: (preset) => set((state) => ({
    config: { ...state.config, colorStops: PRESETS[preset] },
    activePreset: preset,
  })),

  reset: () => set({
    isActive: false,
    config: defaultConfig,
    activePreset: 'classic',
    isPanelOpen: false,
  }),
}))
