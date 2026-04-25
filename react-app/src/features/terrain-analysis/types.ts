export type AspectDirection =
  | 'flat'
  | 'north'
  | 'northeast'
  | 'east'
  | 'southeast'
  | 'south'
  | 'southwest'
  | 'west'
  | 'northwest'

export interface TerrainAnalysisPoint {
  lng: number
  lat: number
}

export interface TerrainAnalysisResult {
  point: TerrainAnalysisPoint
  elevation: number
  slopeDegrees: number
  slopePercent: number
  aspectDegrees: number | null
  direction: AspectDirection
  directionLabel: string
  tileZoom: number
  source: 'aws-terrarium'
}

export interface TerrainAnalysisState {
  isActive: boolean
  isPanelOpen: boolean
  isLoading: boolean
  error: string | null
  selectedPoint: TerrainAnalysisPoint | null
  result: TerrainAnalysisResult | null

  activate: () => void
  deactivate: () => void
  toggle: () => void
  setPanelOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedPoint: (point: TerrainAnalysisPoint | null) => void
  setResult: (result: TerrainAnalysisResult | null) => void
  reset: () => void
}
