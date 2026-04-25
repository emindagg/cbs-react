import { create } from 'zustand'

import type { TerrainAnalysisState } from '@/features/terrain-analysis'

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
    }
  }),

  setMode: (mode) => set((state) => ({
    mode,
    error: null,
    selectedPoint: mode === 'point-aspect' ? state.selectedPoint : null,
    result: mode === 'point-aspect' ? state.result : null,
    selectedPolygonId: mode === 'polygon-slope' ? state.selectedPolygonId : null,
    slopeResult: mode === 'polygon-slope' ? state.slopeResult : null,
  })),
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedPoint: (point) => set({ selectedPoint: point }),
  setResult: (result) => set({ result }),
  setSelectedPolygonId: (id) => set({ selectedPolygonId: id }),
  setSlopeResult: (result) => set({ slopeResult: result }),

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
  }),
}))
