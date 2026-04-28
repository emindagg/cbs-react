import { create } from 'zustand'

import type { TerrainAnalysisState } from '@/features/terrain-analysis'

const DEFAULT_SLOPE_OPACITY = 0.92
const DEFAULT_ASPECT_OPACITY = 0.92

export const useTerrainAnalysisStore = create<TerrainAnalysisState>((set) => ({
  isActive: false,
  isPanelOpen: false,
  isLoading: false,
  error: null,
  mode: 'point-aspect',
  selectedPoint: null,
  result: null,
  selectedPolygonId: null,
  slopeResult: null,
  slopeOpacity: DEFAULT_SLOPE_OPACITY,
  aspectResult: null,
  aspectOpacity: DEFAULT_ASPECT_OPACITY,

  activate: () => set({ isActive: true, isPanelOpen: true }),

  deactivate: () => set({
    isActive: false,
    isPanelOpen: false,
    isLoading: false,
    error: null,
    mode: 'point-aspect',
    selectedPoint: null,
    result: null,
    selectedPolygonId: null,
    slopeResult: null,
    aspectResult: null,
  }),

  toggle: () => set((state) => {
    const nextActive = !state.isActive
    return {
      isActive: nextActive,
      isPanelOpen: nextActive,
      isLoading: false,
      error: null,
      mode: nextActive ? state.mode : 'point-aspect',
      selectedPoint: nextActive ? state.selectedPoint : null,
      result: nextActive ? state.result : null,
      selectedPolygonId: nextActive ? state.selectedPolygonId : null,
      slopeResult: nextActive ? state.slopeResult : null,
      aspectResult: nextActive ? state.aspectResult : null,
    }
  }),

  setMode: (mode) => set((state) => ({
    mode,
    error: null,
    selectedPoint: mode === 'point-aspect' ? state.selectedPoint : null,
    result: mode === 'point-aspect' ? state.result : null,
    selectedPolygonId: mode === 'polygon-slope' || mode === 'polygon-aspect' ? state.selectedPolygonId : null,
    slopeResult: mode === 'polygon-slope' ? state.slopeResult : null,
    aspectResult: mode === 'polygon-aspect' ? state.aspectResult : null,
  })),
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedPoint: (point) => set({ selectedPoint: point }),
  setResult: (result) => set({ result }),
  setSelectedPolygonId: (id) => set({ selectedPolygonId: id }),
  setSlopeResult: (result) => set({ slopeResult: result }),
  setSlopeOpacity: (opacity) => set({ slopeOpacity: Math.max(0, Math.min(1, opacity)) }),
  setAspectResult: (result) => set({ aspectResult: result }),
  setAspectOpacity: (opacity) => set({ aspectOpacity: Math.max(0, Math.min(1, opacity)) }),

  reset: () => set({
    isActive: false,
    isPanelOpen: false,
    isLoading: false,
    error: null,
    mode: 'point-aspect',
    selectedPoint: null,
    result: null,
    selectedPolygonId: null,
    slopeResult: null,
    slopeOpacity: DEFAULT_SLOPE_OPACITY,
    aspectResult: null,
    aspectOpacity: DEFAULT_ASPECT_OPACITY,
  }),
}))
