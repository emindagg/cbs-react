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

export type TerrainAnalysisMode = 'point-aspect' | 'polygon-slope' | 'polygon-aspect'

export interface TerrainSlopeClass {
  min: number
  max: number | null
  label: string
  color: string
  pixelCount: number
}

export interface TerrainSlopeRaster {
  width: number
  height: number
  bbox: [number, number, number, number]
  imageDataUrl: string
}

export interface TerrainSlopeResult {
  itemId: string
  itemName: string
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  areaKm2: number
  raster: TerrainSlopeRaster
  classes: TerrainSlopeClass[]
  minSlopePercent: number
  maxSlopePercent: number
  avgSlopePercent: number
  tileZoom: number
  /** Seçilen DEM çözünürlüğü (metre/piksel) - LOD seviyesinin metrik karşılığı */
  resolutionMeters: number
  /** Tahmini indirilen DEM tile sayısı */
  estimatedTiles: number
  source: 'aws-terrarium'
}

export interface TerrainAspectClass {
  direction: AspectDirection
  label: string
  color: string
  pixelCount: number
  /** Sınıfın açı aralığı başlangıcı (derece). flat sınıfı için -1. */
  fromDeg: number
  /** Sınıfın açı aralığı bitişi (derece). flat sınıfı için -1. */
  toDeg: number
}

export interface TerrainAspectResult {
  itemId: string
  itemName: string
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  areaKm2: number
  raster: TerrainSlopeRaster
  classes: TerrainAspectClass[]
  /** En çok piksele sahip yön (flat hariç) */
  dominantDirection: AspectDirection
  /** Düz piksellerin polygon içindeki oranı (0-100) */
  flatPercent: number
  tileZoom: number
  resolutionMeters: number
  estimatedTiles: number
  source: 'aws-terrarium'
}

export interface TerrainPolygonOption {
  id: string
  name: string
  areaKm2: number
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
}

export interface TerrainAnalysisState {
  isActive: boolean
  isPanelOpen: boolean
  isLoading: boolean
  error: string | null
  mode: TerrainAnalysisMode
  selectedPoint: TerrainAnalysisPoint | null
  result: TerrainAnalysisResult | null
  selectedPolygonId: string | null
  slopeResult: TerrainSlopeResult | null
  slopeOpacity: number
  aspectResult: TerrainAspectResult | null
  aspectOpacity: number

  activate: () => void
  deactivate: () => void
  toggle: () => void
  setMode: (mode: TerrainAnalysisMode) => void
  setPanelOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedPoint: (point: TerrainAnalysisPoint | null) => void
  setResult: (result: TerrainAnalysisResult | null) => void
  setSelectedPolygonId: (id: string | null) => void
  setSlopeResult: (result: TerrainSlopeResult | null) => void
  setSlopeOpacity: (opacity: number) => void
  setAspectResult: (result: TerrainAspectResult | null) => void
  setAspectOpacity: (opacity: number) => void
  reset: () => void
}
