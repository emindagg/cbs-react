/**
 * Dynamic Legend — Type Definitions
 *
 * Re-exports existing visualization types for convenience and adds
 * internal types used exclusively by the Legend sub-components.
 */

import type {
  ClassificationMethod,
  ColorScaleType,
  LegendConfiguration,
} from '../../types/visualization'

// ── Public re-exports ─────────────────────────────────────────
export type { ColorScaleType, LegendConfiguration }

/** Label layout mode determined by collision detection */
export type LabelLayoutMode = 'inline' | 'vertical' | 'thinned'

/** Single label descriptor used internally */
export interface LabelDescriptor {
  /** The numeric boundary value */
  value: number
  /** Formatted display text */
  text: string
  /** Horizontal position in pixels (left offset) */
  x: number
  /** Estimated width in pixels */
  estimatedWidth: number
  /** Whether this label is visible after thinning */
  visible: boolean
}

// ── Component Props ───────────────────────────────────────────

/** Props accepted by the top-level DynamicLegend (drop-in for old Legend) */
export interface DynamicLegendProps {
  config: LegendConfiguration
  breaks: number[]
  colors: string[]
  scaleType: ColorScaleType
  classificationMethod?: ClassificationMethod
  onHover?: (index: number | null) => void
  onTitleChange?: (title: string) => void
  /** Haritadaki choropleth-fill opacity'si ile senkron swatch opaklığı */
  fillOpacity?: number
}

/** Props for the color bar sub-component */
export interface LegendBarProps {
  mode: ColorScaleType
  colors: string[]
  breaks: number[]
  width: number
  barHeight?: number
  fillOpacity?: number
}

/** Props for the labels sub-component */
export interface LegendLabelsProps {
  breaks: number[]
  colors: string[]
  width: number
  formatLabel: (value: number) => string
  mode: ColorScaleType
  classificationMethod?: ClassificationMethod
  labelType: 'ruler' | 'ranges' | 'custom'
  customLabels?: string[]
  reverseOrder?: boolean
  fillOpacity?: number
}

/** Props for a single smart label */
export interface SmartLabelProps {
  label: LabelDescriptor
  layoutMode: LabelLayoutMode
  barHeight: number
}
