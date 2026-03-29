// Bubble visualization
export { BubbleRenderer, BubbleSettings, useBubbleTooltip, BUBBLE_DEFAULT_FILL_COLOR } from './bubble'

// Choropleth visualization
export { ChoroplethRenderer, useChoroplethTooltip } from './choropleth'

// Point / Dot-density visualization
export {
  PointRenderer,
  DotDensitySettings,
  DotColorPicker,
  DEFAULT_DOT_SIZE,
  DEFAULT_DOT_COLOR,
  DEFAULT_DOT_OPACITY,
  TARGET_TOTAL_DOTS,
  MAX_TOTAL_DOTS,
  MIN_DOTS_PER_FEATURE,
  MAX_DOTS_PER_FEATURE,
  buildZoomRadius,
  calculateSmartDotValue,
  DEFAULT_BACKDROP_FILL_OPACITY,
} from './point'

// Shared orchestrator
export { VisualizationManager, getVisualizationManager } from './shared/VisualizationManager'
export { useVisualizationLayerPersistence } from './hooks/useVisualizationLayerPersistence'
