// Bubble visualization
export { BubbleRenderer, BubbleSettings, useBubbleTooltip } from './bubble'

// Choropleth visualization
export { ChoroplethRenderer, useChoroplethTooltip } from './choropleth'

// Point / Dot-density visualization
export {
  PointRenderer,
  DotDensitySettings,
  DotColorPicker,
  DEFAULT_DOT_SIZE,
  DEFAULT_DOT_COLOR,
  TARGET_TOTAL_DOTS,
  MAX_TOTAL_DOTS,
  MIN_DOTS_PER_FEATURE,
  MAX_DOTS_PER_FEATURE,
  buildZoomRadius,
  calculateSmartDotValue,
} from './point'

// Shared orchestrator
export { VisualizationManager } from './shared/VisualizationManager'
