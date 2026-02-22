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
  cool: [
    [0, 'rgba(0,0,0,0)'],
    [0.2, 'rgb(0,128,128)'],
    [0.4, 'rgb(0,200,200)'],
    [0.6, 'rgb(100,230,200)'],
    [0.8, 'rgb(180,255,180)'],
    [1, 'rgb(255,255,200)'],
  ],
  warm: [
    [0, 'rgba(0,0,0,0)'],
    [0.2, 'rgb(128,0,38)'],
    [0.4, 'rgb(189,0,38)'],
    [0.6, 'rgb(240,59,32)'],
    [0.8, 'rgb(253,141,60)'],
    [1, 'rgb(254,217,118)'],
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
  })),

  reset: () => set({
    isActive: false,
    config: defaultConfig,
    isPanelOpen: false,
  }),
}))
