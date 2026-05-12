import { create } from 'zustand'

import type { NearestPointsConfig, SpatialAnalysisState, SpatialLayerStyle } from '@/features/spatial-analysis'

const defaultConvexHullStyle: SpatialLayerStyle = {
  fillColor: '#f97316',
  fillOpacity: 0.15,
  lineOpacity: 1,
  strokeColor: '#ea580c',
  strokeWidth: 2.5,
}

const defaultVoronoiStyle: SpatialLayerStyle = {
  fillColor: '#06b6d4',
  fillOpacity: 0.08,
  lineOpacity: 1,
  strokeColor: '#0891b2',
  strokeWidth: 1.5,
}

const defaultNearestPointsStyle: SpatialLayerStyle = {
  fillColor: '#8b5cf6',
  fillOpacity: 0.6,
  lineOpacity: 0.6,
  strokeColor: '#7c3aed',
  strokeWidth: 1.5,
}

const defaultNearestPointsConfig: NearestPointsConfig = {
  showAllLines: false,
  showShortestOnly: true,
  showLabels: true,
  inputLayer: null,
  targetLayers: [],
  searchRadiusKm: null,
  closestCount: 1,
}

export const useSpatialAnalysisStore = create<SpatialAnalysisState>((set) => ({
  activeAnalysis: null,
  isPanelOpen: false,
  convexHullStyle: defaultConvexHullStyle,
  voronoiStyle: defaultVoronoiStyle,
  nearestPointsStyle: defaultNearestPointsStyle,
  nearestPointsConfig: defaultNearestPointsConfig,
  nearestStats: null,

  activate: (type) => set({ activeAnalysis: type, isPanelOpen: true }),

  deactivate: () => set({ activeAnalysis: null, isPanelOpen: false, nearestStats: null }),

  toggle: (type) => set((state) => {
    if (state.activeAnalysis === type) {
      return { activeAnalysis: null, isPanelOpen: false, nearestStats: null }
    }
    return { activeAnalysis: type, isPanelOpen: true }
  }),

  setPanelOpen: (open) => set({ isPanelOpen: open }),

  setConvexHullStyle: (style) => set((state) => ({
    convexHullStyle: { ...state.convexHullStyle, ...style },
  })),

  setVoronoiStyle: (style) => set((state) => ({
    voronoiStyle: { ...state.voronoiStyle, ...style },
  })),

  setNearestPointsStyle: (style) => set((state) => ({
    nearestPointsStyle: { ...state.nearestPointsStyle, ...style },
  })),

  setNearestPointsConfig: (config) => set((state) => ({
    nearestPointsConfig: { ...state.nearestPointsConfig, ...config },
  })),

  setNearestStats: (stats) => set({ nearestStats: stats }),

  reset: () => set({
    activeAnalysis: null,
    isPanelOpen: false,
    convexHullStyle: defaultConvexHullStyle,
    voronoiStyle: defaultVoronoiStyle,
    nearestPointsStyle: defaultNearestPointsStyle,
    nearestPointsConfig: defaultNearestPointsConfig,
    nearestStats: null,
  }),
}))
