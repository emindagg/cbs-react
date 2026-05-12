export type SpatialAnalysisType = 'convex-hull' | 'voronoi' | 'nearest-points'

export interface SpatialLayerStyle {
  fillColor: string
  fillOpacity: number
  lineOpacity: number
  strokeColor: string
  strokeWidth: number
}

export interface NearestPointsStats {
  totalPairs: number
  shortestDistance: number
  averageDistance: number
}

/**
 * "Girdi" ve "Hedef" katman kimlikleri kullanıcının yüklediği dosyaların
 * sourceLabel değerleridir. Çizilen öğeler için sabit "__drawn__" id'si kullanılır.
 * Her ikisi null ise eski "tek koleksiyon, kendi içinde komşuluk" davranışı korunur.
 */
export interface NearestPointsConfig {
  showAllLines: boolean
  showShortestOnly: boolean
  showLabels: boolean
  inputLayer: string | null
  targetLayer: string | null
  searchRadiusKm: number | null
  closestCount: number
}

export interface SpatialLayerOption {
  id: string
  label: string
  count: number
}

export interface SpatialAnalysisState {
  activeAnalysis: SpatialAnalysisType | null
  isPanelOpen: boolean
  convexHullStyle: SpatialLayerStyle
  voronoiStyle: SpatialLayerStyle
  nearestPointsStyle: SpatialLayerStyle
  nearestPointsConfig: NearestPointsConfig
  nearestStats: NearestPointsStats | null

  activate: (type: SpatialAnalysisType) => void
  deactivate: () => void
  toggle: (type: SpatialAnalysisType) => void
  setPanelOpen: (open: boolean) => void
  setConvexHullStyle: (style: Partial<SpatialLayerStyle>) => void
  setVoronoiStyle: (style: Partial<SpatialLayerStyle>) => void
  setNearestPointsStyle: (style: Partial<SpatialLayerStyle>) => void
  setNearestPointsConfig: (config: Partial<NearestPointsConfig>) => void
  setNearestStats: (stats: NearestPointsStats | null) => void
  reset: () => void
}
