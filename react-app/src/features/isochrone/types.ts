export type OrsProfile = 'driving-car' | 'cycling-regular' | 'foot-walking'

export interface RouteStats {
  distance: number  // metres
  duration: number  // seconds
}

export interface IsochroneState {
  isActive: boolean
  isPanelOpen: boolean
  mode: OrsProfile
  selectedTimes: number[]
  origin: [number, number] | null
  isochroneData: GeoJSON.FeatureCollection | null
  routeData: GeoJSON.Feature | null
  routeStats: RouteStats | null
  isLoading: boolean
  isRouteLoading: boolean
  isAwaitingDestination: boolean
  error: string | null
}

export interface IsochroneActions {
  toggle: () => void
  setMode: (mode: OrsProfile) => void
  toggleTime: (minutes: number) => void
  setOrigin: (latlng: [number, number] | null) => void
  setIsochroneData: (data: GeoJSON.FeatureCollection | null) => void
  setRouteData: (data: GeoJSON.Feature | null) => void
  setRouteStats: (stats: RouteStats | null) => void
  setLoading: (loading: boolean) => void
  setRouteLoading: (loading: boolean) => void
  setAwaitingDestination: (v: boolean) => void
  setError: (msg: string | null) => void
  setPanelOpen: (open: boolean) => void
  reset: () => void
}

export type IsochroneStore = IsochroneState & IsochroneActions
