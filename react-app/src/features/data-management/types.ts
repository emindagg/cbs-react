import type { Geometry } from 'geojson'

export type DrawMode = 'none' | 'point' | 'polygon' | 'line'
export type DataItemType = 'point' | 'polygon' | 'line'
export type ExportFormat = 'geojson' | 'kml' | 'shp' | 'xlsx' | 'csv'
export type DataItemSource = 'drawn' | 'imported'

export interface LayerStyles {
  clusterEnabled: boolean
  opacity: number
  strokeOpacity: number
  width: number
  lineWidth: number
  fillColor: string
  strokeWidth: number
  strokeColor: string
  labelField: string
  textSize: number
  textColor: string
}

export interface FabPosition {
  x: number
  y: number
}

export interface DataItem {
  id: string
  name: string
  type: DataItemType
  date?: string
  geometry: Geometry
  properties: Record<string, unknown>
  visible: boolean
  source: DataItemSource
  sourceLabel?: string
}

export type NewDataItem = Omit<DataItem, 'id' | 'visible' | 'source'>

export interface ColumnMapping {
  lat?: string
  lon?: string
  name?: string
  type?: string
  geometry?: string
}

export interface ParseResult {
  items?: NewDataItem[]
  needsMapping?: boolean
  data?: Record<string, unknown>[]
  headers?: string[]
  mapping?: ColumnMapping
}

export interface MapperData {
  headers: string[]
  previewData: Record<string, unknown>[]
  initialMapping: ColumnMapping
  jsonData: Record<string, unknown>[]
}

export interface DataManagementStore {
  items: DataItem[]
  activeItemId: string | null
  hasImportedData: boolean
  importedLayerName: string | null
  layerStyles: LayerStyles
  fabPosition: FabPosition | null

  drawMode: DrawMode
  drawPoints: [number, number][]
  drawGhostPoint: [number, number] | null
  isDrawing: boolean
  drawUndoStack: [number, number][][]
  drawRedoStack: [number, number][][]

  addItem: (item: NewDataItem) => void
  addItems: (items: NewDataItem[]) => void
  removeItem: (id: string) => void
  removeImportedLayer: () => void
  toggleVisibility: (id: string) => void
  toggleImportedLayerVisibility: () => void
  toggleImportedSourceVisibility: (sourceLabel: string) => void
  setActiveItem: (id: string | null) => void
  updateLayerStyle: (styles: Partial<LayerStyles>) => void
  updateItemFillColor: (id: string, fillColor: string) => void
  updateItemProperties: (id: string, properties: Record<string, unknown>) => void
  setFabPosition: (position: FabPosition) => void
  clearAll: () => void
  clearBufferAnalysisItems: () => void

  setDrawMode: (mode: DrawMode) => void
  setDrawPoints: (points: [number, number][]) => void
  setDrawGhostPoint: (point: [number, number] | null) => void
  setIsDrawing: (isDrawing: boolean) => void
  updateDrawPoint: (index: number, point: [number, number]) => void
  undoDraw: () => void
  redoDraw: () => void
  resetDraw: () => void
}
