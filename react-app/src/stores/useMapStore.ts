import type { Map } from 'maplibre-gl'
import { create } from 'zustand'

export type BasemapType =
  | 'TEMEL'
  | 'UYDU'
  | 'GECE'
  | 'SIYASI'
  | 'YUKSEKLIK'
  | 'NONE'
  | 'CARTO_LIGHT'
  | 'CARTO_DARK'
  | 'CARTO_VOYAGER'
  | 'ESRI_SATELLITE'

interface MapState {
  isLoaded: boolean
  zoom: number
  center: [number, number]
  activeBasemap: BasemapType
  mapInstance: Map | null
  isGlobeMode: boolean
  northArrowVisible: boolean

  setLoaded: (loaded: boolean) => void
  setViewState: (zoom: number, center: [number, number]) => void
  setActiveBasemap: (basemap: BasemapType) => void
  setMapInstance: (map: Map | null) => void
  setGlobeMode: (isGlobe: boolean) => void
  setNorthArrowVisible: (visible: boolean) => void
}

// Default Turkey center coordinates
const TURKEY_CENTER: [number, number] = [35.2433, 38.9637]

export const useMapStore = create<MapState>((set) => ({
  isLoaded: false,
  zoom: 6,
  center: TURKEY_CENTER,
  activeBasemap: 'CARTO_LIGHT', // Default
  mapInstance: null,
  isGlobeMode: false,
  northArrowVisible: true,

  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setViewState: (zoom, center) => set({ zoom, center }),
  setActiveBasemap: (basemap) => set({ activeBasemap: basemap }),
  setMapInstance: (map) => set({ mapInstance: map }),
  setGlobeMode: (isGlobe) => set({ isGlobeMode: isGlobe }),
  setNorthArrowVisible: (visible) => set({ northArrowVisible: visible }),
}))
