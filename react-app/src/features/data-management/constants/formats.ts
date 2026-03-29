/**
 * Supported file formats for data import/export
 */

export const SUPPORTED_IMPORT_FORMATS = {
  GEOJSON: ['json', 'geojson'],
  EXCEL: ['xlsx', 'xls', 'csv'],
  KML: ['kml'],
  SHAPEFILE: ['zip'],
} as const

export const EXPORT_FORMATS = [
  { value: 'geojson', label: 'GeoJSON (.geojson)' },
  { value: 'kml', label: 'KML (.kml)' },
  { value: 'shp', label: 'Shapefile (.zip)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
] as const

export const FILE_ACCEPT_PATTERN = '.geojson,.json,.kml,.zip,.xlsx,.xls,.csv'

export const COLUMN_PATTERNS = {
  lat: ['lat', 'enlem', 'latitude', 'nlem'],
  lon: ['lon', 'lng', 'boylam', 'longitude', 'oylam'],
  name: ['name', 'ad', 'isim', 'sim', 'il', 'sehir', 'plaka'],
  type: ['type', 'tur', 'tip'],
  geometry: ['geometry', 'geometri'],
} as const

