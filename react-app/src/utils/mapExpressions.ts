import type { InterpolateExpression, StepExpression } from '@/types/maplibre-expressions'

/**
 * MapLibre Expression Builders
 * Builds data-driven styling expressions for GPU-side color rendering
 */

/**
 * Build a step expression for classed/stepped color scales.
 * MapLibre evaluates this on the GPU — no JS loop needed per feature.
 *
 * Output: ['step', ['get', property], defaultColor, break1, color1, break2, color2, ...]
 */
export function buildStepExpression(
  property: string,
  breaks: number[],
  colors: string[],
  defaultColor: string,
): StepExpression {
  // step expression: values below first break get defaultColor
  // then each break threshold maps to the corresponding color
  const expr: unknown[] = ['step', ['get', property], defaultColor]

  for (let i = 0; i < breaks.length - 1; i++) {
    expr.push(breaks[i], colors[i] ?? colors[colors.length - 1])
  }

  return expr as StepExpression
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
