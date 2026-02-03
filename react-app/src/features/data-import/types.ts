/**
 * TypeScript interfaces for data import feature
 */

export interface GeoItem {
  name: string;
  type: 'point' | 'line' | 'polygon' | 'circle';
  geometry: GeoJSON.Geometry;
  properties: Record<string, any>;
  date: string;
  visible: boolean;
}

export interface ColumnMapping {
  lat?: string;
  lon?: string;
  name?: string;
  type?: string;
  geometry?: string;
}

export interface ParseResult {
  items?: GeoItem[];
  needsMapping?: boolean;
  data?: any[];
  headers?: string[];
  mapping?: ColumnMapping;
}

export interface MapperData {
  headers: string[];
  previewData: any[];
  initialMapping: ColumnMapping;
  jsonData: any[];
}

export type FileFormat = 'geojson' | 'excel' | 'kml' | 'shapefile'
export type ExportFormat = 'geojson' | 'kml' | 'shp'
