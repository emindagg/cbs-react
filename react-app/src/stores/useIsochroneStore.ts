import { create } from 'zustand'

import type { IsochroneStore, OrsProfile, RouteStats } from '@/features/isochrone'

const DEFAULT_TIMES = [5, 10, 15]

export const useIsochroneStore = create<IsochroneStore>((set) => ({
  isActive: false,
  isPanelOpen: false,
  mode: 'foot-walking',
  selectedTimes: DEFAULT_TIMES,
  origin: null,
  isochroneData: null,
  routeData: null,
  routeStats: null,
  isLoading: false,
  isRouteLoading: false,
  isAwaitingDestination: false,
  error: null,

  toggle: () => set((state) => {
    const nextActive = !state.isActive
    return {
      isActive: nextActive,
      isPanelOpen: nextActive,
      origin: null,
      isochroneData: null,
      routeData: null,
      routeStats: null,
      isAwaitingDestination: false,
      error: null,
    }
  }),

  setMode: (mode: OrsProfile) => set({ mode }),

  toggleTime: (minutes: number) => set((state) => {
    const exists = state.selectedTimes.includes(minutes)
    const selectedTimes = exists
      ? state.selectedTimes.filter((t) => t !== minutes)
      : [...state.selectedTimes, minutes].sort((a, b) => a - b)
    return { selectedTimes }
  }),

  setOrigin: (latlng) => set({ origin: latlng }),
  setIsochroneData: (data) => set({ isochroneData: data }),
  setRouteData: (data) => set({ routeData: data }),
  setRouteStats: (stats: RouteStats | null) => set({ routeStats: stats }),
  setLoading: (loading) => set({ isLoading: loading }),
  setRouteLoading: (loading) => set({ isRouteLoading: loading }),
  setAwaitingDestination: (v) => set({ isAwaitingDestination: v }),
  setError: (msg) => set({ error: msg }),
  setPanelOpen: (open) => set({ isPanelOpen: open }),

  reset: () => set({
    isActive: false,
    isPanelOpen: false,
    mode: 'foot-walking',
    selectedTimes: DEFAULT_TIMES,
    origin: null,
    isochroneData: null,
    routeData: null,
    routeStats: null,
    isLoading: false,
    isRouteLoading: false,
    isAwaitingDestination: false,
    error: null,
  }),
}))
