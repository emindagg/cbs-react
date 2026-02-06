/**
 * Visualization Types
 * Type definitions for visualization wizard and rendering
 */

export type VizType = 'choropleth' | 'bubble' | 'dot'

export type SymbolShape = 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'pin'
export type SymbolScaling = 'linear' | 'sqrt' | 'log'

export type LocationLevel = 'province' | 'district' | 'mixed'

export type ClassificationMethod =
  | 'quantile'
  | 'equal'
  | 'jenks'
  | 'kmeans'
  | 'rounded-sm'
  | 'logarithmic'
  | 'custom'
  | 'continuous-linear'
  | 'continuous-quantile'
  | 'continuous-natural'

export type ColorScheme =
  // Original
  | 'viridis'
  // ColorBrewer Sequential
  | 'ylorbr'
  | 'ylorrd'
  | 'ylgnbu'
  | 'ylgn'
  | 'reds'
  | 'rdpu'
  | 'purples'
  | 'purd'
  | 'pubugn'
  | 'pubu'
  | 'orrd'
  | 'oranges'
  | 'greys'
  | 'greens'
  | 'gnbu'
  | 'bupu'
  | 'bugn'
  | 'blues'
  // ColorBrewer Diverging
  | 'spectral'
  | 'rdylgn'
  | 'rdylbu'
  | 'rdgy'
  | 'rdbu'
  | 'puor'
  | 'prgn'
  | 'piyg'
  | 'brbg'

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
  // Symbol Map Settings
  symbolShape?: SymbolShape;
  symbolScaling?: SymbolScaling;
  symbolMinSize?: number;
  symbolMaxSize?: number;
  symbolStrokeColor?: string;
  symbolStrokeWidth?: number;
  symbolOpacity?: number;
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

/**
 * Datawrapper-style Interpolation Types
 */
export type InterpolationMethod =
  | 'equidistant'      // Linear/Equal intervals
  | 'quantiles-5'      // Quartiles (4 classes)
  | 'quantiles-6'      // Quintiles (5 classes)
  | 'quantiles-11'     // Deciles (10 classes)
  | 'natural-9'        // Natural breaks (Jenks)

export type ColorScaleType = 'steps' | 'continuous'

export interface CustomRange {
  enabled: boolean;
  min: number | null;
  center: number | null;
  max: number | null;
}

/**
 * Legend Configuration
 */
export type LegendPosition =
  | 'above'
  | 'below'
  | 'inside-left-top'
  | 'inside-center-top'
  | 'inside-right-top'
  | 'inside-left-bottom'
  | 'inside-center-bottom'
  | 'inside-right-bottom'

export type LegendOrientation = 'horizontal' | 'vertical'
export type LegendLabelType = 'ruler' | 'ranges' | 'custom'

export interface LegendConfiguration {
  visible: boolean;
  position: LegendPosition;
  size: number; // pixels
  orientation: LegendOrientation;
  labels: {
    type: LegendLabelType;
    customLabels?: string[];
  };
  format: string; // numeral.js format string
  title?: {
    show: boolean;
    text: string;
  };
  highlightOnHover: boolean;
  reverseOrder: boolean;
}

/**
 * Map Title Configuration
 */
export interface MapTitleConfiguration {
  visible: boolean;
  title: string;
  subtitle?: string;
  position: 'top-left' | 'top-center' | 'top-right';
}

/**
 * Complete Color Configuration (Datawrapper-style)
 */
export interface ColorConfiguration {
  column: string | null;
  palette: ColorScheme;
  scaleType: ColorScaleType;
  interpolation: InterpolationMethod;
  customRange?: CustomRange;
  legend: LegendConfiguration;
}
