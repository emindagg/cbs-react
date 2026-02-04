/**
 * Visualization Types
 * Type definitions for visualization wizard and rendering
 */

export type VizType = 'choropleth' | 'bubble' | 'dot'

export type LocationLevel = 'province' | 'district' | 'mixed'

export type ClassificationMethod =
  | 'quantile'
  | 'equal'
  | 'jenks'
  | 'rounded-sm'
  | 'logarithmic'
  | 'custom'

export type ColorScheme =
  | 'viridis'
  | 'topographic'
  | 'diverging_orange_blue'
  | 'greens'
  | 'reds'
  | 'blues'
  | 'oranges'
  | 'purples'

export type LegendType =
  | 'discrete'
  | 'continuous'
  | 'quantized'
  | 'diverging'
  | 'categorical'

export interface ColumnMapping {
  locationColumn: string | null;
  districtColumn: string | null;
  dataColumn: string | null;
  locationLevel: LocationLevel;
}

export interface MatchResult {
  rowIndex: number;
  matched: boolean;
  ambiguous: boolean;
  location?: string;
  province?: string;
  district?: string;
  value?: number;
  error?: string;
  ambiguousOptions?: Array<{
    name: string;
    province: string;
    properties: Record<string, unknown>;
    geometry: Record<string, unknown>;
  }>;
  originalData: Record<string, unknown>;
}

export interface MatchResults {
  successful: MatchResult[];
  ambiguous: MatchResult[];
  failed: MatchResult[];
}

export interface VisualizationSettings {
  type: VizType;
  classCount: number;
  classificationMethod: ClassificationMethod;
  colorScheme: ColorScheme;
  legendType: LegendType;
  customBreaks?: number[];
}

export interface CurrentVisualization {
  type: VizType | null;
  data: Record<string, unknown>[] | null;
  column: string | null;
}

export interface ProvinceInfo {
  name: string;
  properties: Record<string, unknown>;
  geometry: Record<string, unknown>;
}

export interface DistrictInfo {
  name: string;
  province: string;
  compositeKey: string;
  properties: Record<string, unknown>;
  geometry: Record<string, unknown>;
}

export interface FileInfo {
  rowCount: number;
  columns: string[];
  preview: Record<string, unknown>[];
}

export interface MatchSummary {
  successful: number;
  ambiguous: number;
  failed: number;
}
