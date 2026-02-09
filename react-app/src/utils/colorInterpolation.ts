/**
 * Color Interpolation Utilities
 * Chroma.js-based color interpolation for visualization
 * Supports multiple color spaces (RGB, HSL, LAB, LCH)
 */

import chroma from 'chroma-js'

export type ColorSpace = 'rgb' | 'hsl' | 'lab' | 'hcl'

/**
 * Map our color space names to Chroma.js modes
 */
function mapColorSpace(colorSpace: ColorSpace): chroma.InterpolationMode {
  if (colorSpace === 'hcl') return 'lch' // HCL = LCH in Chroma.js
  return colorSpace as chroma.InterpolationMode
}

/**
 * Main interpolation function
 * Interpolates between two hex colors in the specified color space
 */
export function interpolateColor(
  hex1: string,
  hex2: string,
  t: number,
  colorSpace: ColorSpace = 'lab',
): string {
  const mode = mapColorSpace(colorSpace)
  return chroma.mix(hex1, hex2, t, mode).hex()
}

/**
 * Generate a continuous color scale between multiple colors
 */
export function generateColorScale(
  colors: string[],
  steps: number,
  colorSpace: ColorSpace = 'lab',
): string[] {
  if (colors.length === 0) return []
  if (colors.length === 1) return Array(steps).fill(colors[0])

  const mode = mapColorSpace(colorSpace)
  return chroma.scale(colors).mode(mode).colors(steps)
}

/**
 * Generate a diverging color scale with a neutral midpoint
 */
export function generateDivergingScale(
  startColor: string,
  midColor: string,
  endColor: string,
  steps: number,
  colorSpace: ColorSpace = 'lab',
): string[] {
  const mode = mapColorSpace(colorSpace)
  return chroma.scale([startColor, midColor, endColor]).mode(mode).colors(steps)
}

/**
 * Bezier interpolation for smoother color transitions
 * Note: Chroma.js bezier doesn't support mode() - uses default interpolation
 */
export function bezierInterpolate(colors: string[], t: number, _colorSpace: ColorSpace = 'lab'): string {
  // Chroma.js bezier returns a scale, call it with the parameter to get color
  const bezierScale = chroma.bezier(colors)
  return bezierScale(t).hex()
}

/**
 * Generate a color scale using Bezier interpolation
 * Note: Chroma.js bezier doesn't support mode() - uses default interpolation
 */
export function generateBezierColorScale(
  colors: string[],
  steps: number,
  _colorSpace: ColorSpace = 'lab',
): string[] {
  // Create bezier scale and sample it
  const bezierScale = chroma.bezier(colors)
  const scale: string[] = []

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    scale.push(bezierScale(t).hex())
  }

  return scale
}
