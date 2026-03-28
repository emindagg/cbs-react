/**
 * Visualization Types
 * Type definitions for visualization wizard and rendering
 */

import type { NumberFormat } from '@/utils/numberFormatter'

export type VizType = 'choropleth' | 'bubble' | 'dot'

export type SymbolShape = 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'pin'
export type SymbolScaling = 'sqrt' | 'log'
export type BubbleSizeMode = 'proportional' | 'graduated'

export type NormalizationType = 'none' | 'percent-of-total' | 'field'

export type LocationLevel = 'province' | 'district' | 'mixed'

export type ClassificationMethod =
  | 'quantile'
  | 'equal'
  | 'jenks'
  | 'kmeans'
  | 'custom'
  | 'stddev'
  | 'continuous-linear'
  | 'continuous-quantile'
  | 'continuous-natural'

export type ColorScheme =
  | 'viridis'
  | 'greenBlue'
  | 'sunset'
  | 'plasma'
  | 'yellowGreen'
  | 'pinkPurple'
  | 'yellowBlue'
  | 'rosePurple'
  | 'brownTeal'
  | 'pinkGreen'
  | 'redBlue'
  | 'redTeal'
  // New Palettes
  | 'teal'
  | 'slate'
  | 'orange'
  | 'amber'
  | 'redBlueDiverging'
  | 'tropicalBliss'
  // Tek-Renk Skalalar
  | 'blues'
  | 'reds'
  | 'greens'
  | 'purples'
  // Kategorik
  | 'colorblindSafe'
  // Yükseklik Paletleri
  | 'elevationTerrain'
  | 'elevationLand'
  | 'elevationAnalytic'
  | 'elevationArctic'

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
  plateCode?: string;
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
  /** Continuous modda renk ölçeği: equidistant, quantiles-*, natural-9 */
  interpolation?: InterpolationMethod;
  /** Custom breaks for 'custom' classification method */
  customBreaks?: number[];
  // Symbol Map Settings
  /** Kabarcık boyutlandırma modu: proportional (varsayılan) veya graduated (basamaklı) */
  bubbleSizeMode?: BubbleSizeMode;
  symbolShape?: SymbolShape;
  symbolScaling?: SymbolScaling;
  symbolMinSize?: number;
  symbolMaxSize?: number;
  symbolStrokeColor?: string;
  symbolStrokeWidth?: number;
  symbolOpacity?: number;
  // Choropleth Settings
  choroplethOpacity?: number;
  // Dot Density Settings
  /** Her noktanın temsil ettiği birim sayısı (ör. 1 nokta = 55868 kişi). undefined = otomatik */
  dotValue?: number;
  /** Nokta boyutu (px). Varsayılan: 2.4 */
  dotSize?: number;
  /** Noktaların neyi temsil ettiği (lejant etiketi, ör. "Nüfus", "Satış") */
  dotLabel?: string;
  /** Nokta rengi (hex). Varsayılan: #2d6a4f */
  dotColor?: string;
  /** Nokta opaklığı (0-1). Varsayılan: 0.85 */
  dotOpacity?: number;
  /** Dot/Bubble modunda il/ilçe arka plan dolgu şeffaflığı (0-1). Varsayılan: 0.22 */
  backdropFillOpacity?: number;
  // Normalization Settings
  /** Normalizasyon türü: none (ham değer), percent-of-total, field (başka sütuna böl) */
  normalization?: NormalizationType;
  /** 'field' normalizasyonunda bölen sütun adı */
  normalizationField?: string;
  // Bivariate Settings
  /** Renk için ayrı sütun (bivariate mod). undefined = boyut sütunuyla aynı */
  colorColumn?: string;
  /** Render sırasında colorConfig'ten taşınan custom range ayarı */
  customRange?: CustomRange;
  /** Oransal+tek-renk modunda kabarcık dolgu rengi (hex). undefined = renk gradiyanı kullan */
  symbolFillColor?: string;
  /** Boyut lejantında gösterilecek çember sayısı (3-7). Varsayılan: 3 */
  bubbleLegendCount?: number;
  /** Verisi olmayan bölgeleri gizle veya şeffaflaştır */
  dataOnlyMode?: boolean;
  /** dataOnlyMode aktifken görüntüleme şekli */
  dataOnlyStyle?: 'hidden' | 'transparent';
  /** İl/İlçe isimlerini harita üzerinde göster */
  showLabels?: boolean;
  /** Verisi olan bölgelerde değerleri harita üzerinde göster */
  showValues?: boolean;
  /** Verisi olmayan il/ilçe dolgu rengi (hex). Varsayılan: #e4e4e4 */
  noDataColor?: string;
}

export interface CurrentVisualization {
  type: VizType | null;
  data: Record<string, unknown>[] | null;
  column: string | null;
  locationLevel: 'province' | 'district' | null;
  renderSettings: VisualizationSettings | null;
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
 * Interpolation Types
 */
export type InterpolationMethod =
  | 'equidistant'      // Linear/Equal intervals
  | 'quantiles-4'      // Quartiles (4 classes)
  | 'quantiles-5'      // Quintiles (5 classes)
  | 'quantiles-10'     // Deciles (10 classes)
  | 'natural-9'        // Natural breaks (Jenks)

export type ColorScaleType = 'steps' | 'continuous'

export interface CustomRange {
  enabled: boolean;
  min: number | null;
  center: number | null;
  max: number | null;
  outOfRangeMode?: 'gray' | 'transparent';
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
  format: NumberFormat;
  title?: {
    show: boolean;
    text: string;
    fontSize?: number; // pixels
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
  fontSize?: number; // pixels
}

/**
 * Complete Color Configuration
 */
export interface ColorConfiguration {
  column: string | null;
  palette: ColorScheme;
  scaleType: ColorScaleType;
  interpolation: InterpolationMethod;
  customRange?: CustomRange;
  legend: LegendConfiguration;
}
