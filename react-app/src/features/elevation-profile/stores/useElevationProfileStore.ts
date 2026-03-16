import { create } from 'zustand'

import type { ElevationPoint, ElevationProfileState, ElevationStats } from '../types'

const initialState = {
  waypoints: [] as [number, number][],
  ghostPoint: null as [number, number] | null,
  isDrawing: false,
  isPanelOpen: false,
  isLoading: false,
  error: null as string | null,
  elevationData: null as ElevationPoint[] | null,
  stats: null as ElevationStats | null,
  hoverIndex: null as number | null,
  pinnedIndex: null as number | null,
}

export const useElevationProfileStore = create<ElevationProfileState>((set) => ({
  ...initialState,

  addWaypoint: (point) => set((state) => ({ waypoints: [...state.waypoints, point] })),
  setGhostPoint: (ghostPoint) => set({ ghostPoint }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setResult: (data, stats) => set({ elevationData: data, stats }),
  setHoverIndex: (hoverIndex) => set({ hoverIndex }),
  setPinnedIndex: (pinnedIndex) => set({ pinnedIndex }),

  reset: () => set({ ...initialState }),

  deactivate: () => set({
    ...initialState,
    isDrawing: false,
    isPanelOpen: false,
  }),
}))
