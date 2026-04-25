import { create } from 'zustand'

import type { TerrainAnalysisState } from '@/features/terrain-analysis'

export const useTerrainAnalysisStore = create<TerrainAnalysisState>((set) => ({
  isActive: false,
  isPanelOpen: false,
  isLoading: false,
  error: null,
  selectedPoint: null,
  result: null,

  activate: () => set({ isActive: true, isPanelOpen: true }),

  deactivate: () => set({
    isActive: false,
    isPanelOpen: false,
    isLoading: false,
    error: null,
    selectedPoint: null,
    result: null,
  }),

  toggle: () => set((state) => {
    const nextActive = !state.isActive
    return {
      isActive: nextActive,
      isPanelOpen: nextActive,
      isLoading: false,
      error: null,
      selectedPoint: nextActive ? state.selectedPoint : null,
      result: nextActive ? state.result : null,
    }
  }),

  setPanelOpen: (open) => set({ isPanelOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedPoint: (point) => set({ selectedPoint: point }),
  setResult: (result) => set({ result }),

  reset: () => set({
    isActive: false,
    isPanelOpen: false,
    isLoading: false,
    error: null,
    selectedPoint: null,
    result: null,
  }),
}))
