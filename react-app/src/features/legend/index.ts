/**
 * Legend Feature
 * Unified legend components for all visualization types
 */

// Main legend components
export { default as DynamicLegend } from './components/DynamicLegend'
export { default as DotDensityLegend } from './components/DotDensityLegend'
export { default as BubbleSizeLegend } from './components/BubbleSizeLegend'
export { default as ColorLegend } from './components/ColorLegend'

// Legend building blocks
export { default as LegendBar } from './components/LegendBar'
export { default as LegendLabels } from './components/LegendLabels'
export { default as SmartLabel } from './components/SmartLabel'

// Configuration components
export { default as LegendConfig } from './components/Config'
export { default as LegendContainer } from './components/Container'

// Hooks
export { useLabelCollision } from './hooks/useLabelCollision'

// Types
export type * from './types'
