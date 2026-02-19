import type { Geometry } from 'geojson'

export type DrawMode = 'none' | 'point' | 'polygon' | 'line' | 'circle'
export type DataItemType = 'point' | 'polygon' | 'line' | 'circle'
export type ExportFormat = 'geojson' | 'kml' | 'shp' | 'xlsx'

export interface DataItem {
  id: string
  name: string
  type: DataItemType
  date?: string
  geometry: Geometry
  properties: Record<string, unknown>
  visible: boolean
}

export type NewDataItem = Omit<DataItem, 'id' | 'visible'>

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

  drawMode: DrawMode
  drawPoints: [number, number][]
  drawGhostPoint: [number, number] | null
  drawCenter: [number, number] | null
  drawRadius: number | null
  isDrawing: boolean

  addItem: (item: NewDataItem) => void
  addItems: (items: NewDataItem[]) => void
  removeItem: (id: string) => void
  toggleVisibility: (id: string) => void
  setActiveItem: (id: string | null) => void
  clearAll: () => void

  setDrawMode: (mode: DrawMode) => void
  setDrawPoints: (points: [number, number][]) => void
  setDrawGhostPoint: (point: [number, number] | null) => void
  setDrawCenter: (center: [number, number] | null) => void
  setDrawRadius: (radius: number | null) => void
  setIsDrawing: (isDrawing: boolean) => void
  resetDraw: () => void
}
