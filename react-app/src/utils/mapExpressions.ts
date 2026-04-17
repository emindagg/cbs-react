import type { CaseExpression, InterpolateExpression } from '@/types/maplibre-expressions'

/**
 * MapLibre Expression Builders
 * Builds data-driven styling expressions for GPU-side color rendering
 */

/**
 * Build a classed color expression using GIS-convention semantics.
 *
 * Unlike MapLibre's native `step` (which is lower-inclusive `[b, b+1)`), this
 * emits a `case` expression that is upper-inclusive `(b, b+1]` — the same
 * convention used by ArcGIS/QGIS and by the "lower - upper" legend labels.
 * A value equal to a break boundary lands in the lower class, matching what
 * the legend text implies.
 *
 * Semantics for breaks `[b0, b1, ..., bN]` and colors `[c0, ..., c(N-1)]`:
 *   - value < b0           → defaultColor
 *   - b0 ≤ value ≤ b1      → c0  (first class includes the min)
 *   - b(i-1) < value ≤ bi  → c(i-1)   for i = 2..N
 *   - value > bN           → c(N-1)  (fallback)
 */
export function buildStepExpression(
  property: string,
  breaks: number[],
  colors: string[],
  defaultColor: string,
): CaseExpression {
  if (breaks.length === 0) {
    return ['case', ['!=', ['get', property], null], defaultColor, defaultColor] as CaseExpression
  }
  if (breaks.length === 1) {
    const color = colors[0] ?? defaultColor
    return ['case', ['!=', ['get', property], null], color, defaultColor] as CaseExpression
  }

  const expr: unknown[] = [
    'case',
    ['==', ['get', property], null], defaultColor,
    ['<', ['get', property], breaks[0]], defaultColor,
  ]

  for (let i = 1; i < breaks.length; i++) {
    const color = colors[i - 1] ?? colors[colors.length - 1] ?? defaultColor
    expr.push(['<=', ['get', property], breaks[i]], color)
  }

  expr.push(colors[colors.length - 1] ?? defaultColor)

  return expr as CaseExpression
}

/**
 * Build an interpolate expression for continuous color scales.
 * MapLibre interpolates colors on the GPU between the provided stops.
 *
 * Output: ['interpolate', ['linear'], ['get', property], stop0, color0, stop1, color1, ...]
 */
export function buildInterpolateExpression(
  property: string,
  colorStops: [number, string][],
): InterpolateExpression {
  const expr: unknown[] = ['interpolate', ['linear'], ['get', property]]

  for (const [stop, color] of colorStops) {
    expr.push(stop, color)
  }

  return expr as InterpolateExpression
}
