import type { Feature, FeatureCollection, MultiPolygon, Polygon, Point } from 'geojson'

export type InterpolationMethod = 'idw' | 'kriging'

export type InterpolationGridType = 'smooth' | 'square' | 'hex' | 'triangle' | 'isoband'

export type KrigingModel = 'gaussian' | 'exponential' | 'spherical'

export type InterpolationColorRamp =
  | 'spectral'
  | 'spectral-reverse'
  | 'green-red'
  | 'red-green'
  | 'viridis'
  | 'magma'
  | 'terrain'
  | 'blues'
  | 'reds'

export type InterpolationSymbology = 'stretch' | 'classify'

export interface InterpolationConfig {
  method: InterpolationMethod
  valueColumn: string
  gridType: InterpolationGridType
  cellWidth: number
  idwPower: number
  krigingModel: KrigingModel
  krigingSigma2: number
  krigingAlpha: number
  classCount: number
  colorRamp: InterpolationColorRamp
  symbology: InterpolationSymbology
  fillOpacity: number
  showPointValues: boolean
}

export interface InterpolationRaster {
  width: number
  height: number
  bbox: [number, number, number, number]
  values: Float32Array
}

export interface InterpolationResult {
  grid: FeatureCollection<Polygon | MultiPolygon | Point> | null
  raster: InterpolationRaster | null
  points: FeatureCollection<Point>
  min: number
  max: number
  valueColumn: string
  method: InterpolationMethod
}

export interface InterpolationWorkerInput {
  points: FeatureCollection<Point>
  config: InterpolationConfig
}

export type InterpolationWorkerOutput =
  | {
      result: {
        grid: FeatureCollection<Polygon | MultiPolygon | Point> | null
        raster: InterpolationRaster | null
        min: number
        max: number
      }
    }
  | { error: string }

export interface InterpolationLegendSettings {
  title: string | null
  position: { x: number; y: number } | null
}

export interface InterpolationState {
  isActive: boolean
  isPanelOpen: boolean
  config: InterpolationConfig
  result: InterpolationResult | null
  isProcessing: boolean
  error: string | null
  legend: InterpolationLegendSettings

  activate: () => void
  deactivate: () => void
  toggle: () => void
  setPanelOpen: (open: boolean) => void
  setConfig: (partial: Partial<InterpolationConfig>) => void
  setResult: (result: InterpolationResult | null) => void
  setIsProcessing: (processing: boolean) => void
  setError: (error: string | null) => void
  setLegendTitle: (title: string | null) => void
  setLegendPosition: (position: { x: number; y: number } | null) => void
  reset: () => void
}

export type { Feature, FeatureCollection, MultiPolygon, Polygon, Point }
