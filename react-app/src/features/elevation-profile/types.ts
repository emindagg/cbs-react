export interface ElevationPoint {
  distance: number    // kümülatif km
  elevation: number   // metre
  lng: number
  lat: number
}

export interface ElevationStats {
  minElevation: number
  maxElevation: number
  avgElevation: number  // ortalama rakım (m)
  totalAscent: number   // toplam kazanım (m)
  totalDescent: number  // toplam kayıp (m)
  totalDistance: number // km
  maxSlope: number      // maksimum eğim (%)
  avgSlope: number      // ortalama eğim (%)
}

export interface ElevationProfileState {
  waypoints: [number, number][]
  ghostPoint: [number, number] | null
  isDrawing: boolean
  isPanelOpen: boolean
  isLoading: boolean
  error: string | null
  elevationData: ElevationPoint[] | null
  stats: ElevationStats | null
  // Map-Chart Synchronization: grafik hover noktasının koordinat datasını taşır
  activePoint: ElevationPoint | null
  // actions
  addWaypoint: (point: [number, number]) => void
  setGhostPoint: (point: [number, number] | null) => void
  setIsDrawing: (v: boolean) => void
  setPanelOpen: (v: boolean) => void
  setLoading: (v: boolean) => void
  setError: (msg: string | null) => void
  setResult: (data: ElevationPoint[], stats: ElevationStats) => void
  setActivePoint: (point: ElevationPoint | null) => void
  reset: () => void
  deactivate: () => void
}
