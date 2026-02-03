import { create } from 'zustand'

export type BasemapType = 'TEMEL' | 'UYDU' | 'GECE' | 'SIYASI' | 'YUKSEKLIK' | 'NONE' | 'CARTO_LIGHT' | 'CARTO_DARK' | 'CARTO_VOYAGER'

interface MapState {
    isLoaded: boolean
    zoom: number
    center: [number, number]
    activeBasemap: BasemapType

    setLoaded: (loaded: boolean) => void
    setViewState: (zoom: number, center: [number, number]) => void
    setActiveBasemap: (basemap: BasemapType) => void
}

export const useMapStore = create<MapState>((set) => ({
    isLoaded: false,
    zoom: 6,
    center: [35.2433, 38.9637],
    activeBasemap: 'CARTO_LIGHT', // Default

    setLoaded: (loaded) => set({ isLoaded: loaded }),
    setViewState: (zoom, center) => set({ zoom, center }),
    setActiveBasemap: (basemap) => set({ activeBasemap: basemap }),
}))
