// Shared facade for visualization APIs consumed across features.
// This keeps cross-feature imports on a stable boundary.
export { VisualizationManager } from '@/features/visualization'
export {
  DEFAULT_DOT_SIZE,
  DEFAULT_DOT_COLOR,
  DEFAULT_DOT_OPACITY,
  buildZoomRadius,
  calculateSmartDotValue,
  DotDensitySettings,
  BubbleSettings,
  useBubbleTooltip,
  useChoroplethTooltip,
} from '@/features/visualization'
