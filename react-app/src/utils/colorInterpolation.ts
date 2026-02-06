/**
 * Color Interpolation Utilities
 * Advanced color interpolation inspired by Datawrapper
 * Supports multiple color spaces (RGB, HSL, LAB, HCL) and interpolation methods
 */

export type ColorSpace = 'rgb' | 'hsl' | 'lab' | 'hcl'
export type InterpolationMode = 'linear' | 'bezier' | 'basis'

interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number
  s: number
  l: number
}

interface LAB {
  l: number
  a: number
  b: number
}

interface HCL {
  h: number
  c: number
  l: number
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  }
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const { r, g, b } = rgb
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6
  } else {
    h = ((r - g) / d + 4) / 6
  }

  return { h: h * 360, s, l }
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl
  const hNorm = h / 360

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  if (s === 0) {
    return { r: l, g: l, b: l }
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return {
    r: hue2rgb(p, q, hNorm + 1 / 3),
    g: hue2rgb(p, q, hNorm),
    b: hue2rgb(p, q, hNorm - 1 / 3),
  }
}

/**
 * Convert RGB to LAB color space (D65 illuminant)
 */
export function rgbToLab(rgb: RGB): LAB {
  // RGB to XYZ
  let r = rgb.r
  let g = rgb.g
  let b = rgb.b

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  let x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
  let y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1.0
  let z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883

  // XYZ to LAB
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  }
}

/**
 * Convert LAB to RGB
 */
export function labToRgb(lab: LAB): RGB {
  let y = (lab.l + 16) / 116
  let x = lab.a / 500 + y
  let z = y - lab.b / 200

  x = 0.95047 * (x * x * x > 0.008856 ? x * x * x : (x - 16 / 116) / 7.787)
  y = 1.0 * (y * y * y > 0.008856 ? y * y * y : (y - 16 / 116) / 7.787)
  z = 1.08883 * (z * z * z > 0.008856 ? z * z * z : (z - 16 / 116) / 7.787)

  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314
  let g = x * -0.969266 + y * 1.8760108 + z * 0.041556
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b

  return {
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, b)),
  }
}

/**
 * Convert RGB to HCL (Cylindrical LAB)
 */
export function rgbToHcl(rgb: RGB): HCL {
  const lab = rgbToLab(rgb)
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b)
  const h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI

  return {
    h: h < 0 ? h + 360 : h,
    c,
    l: lab.l,
  }
}

/**
 * Convert HCL to RGB
 */
export function hclToRgb(hcl: HCL): RGB {
  const hRad = (hcl.h * Math.PI) / 180
  const lab: LAB = {
    l: hcl.l,
    a: Math.cos(hRad) * hcl.c,
    b: Math.sin(hRad) * hcl.c,
  }
  return labToRgb(lab)
}

/**
 * Linear interpolation between two values
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Interpolate between two colors in RGB space
 */
function interpolateRgb(color1: RGB, color2: RGB, t: number): RGB {
  return {
    r: lerp(color1.r, color2.r, t),
    g: lerp(color1.g, color2.g, t),
    b: lerp(color1.b, color2.b, t),
  }
}

/**
 * Interpolate between two colors in HSL space
 */
function interpolateHsl(hsl1: HSL, hsl2: HSL, t: number): HSL {
  // Handle hue interpolation (shortest path around color wheel)
  const h1 = hsl1.h
  const h2 = hsl2.h
  let dh = h2 - h1

  if (dh > 180) {
    dh -= 360
  } else if (dh < -180) {
    dh += 360
  }

  return {
    h: (h1 + dh * t + 360) % 360,
    s: lerp(hsl1.s, hsl2.s, t),
    l: lerp(hsl1.l, hsl2.l, t),
  }
}

/**
 * Interpolate between two colors in LAB space
 */
function interpolateLab(lab1: LAB, lab2: LAB, t: number): LAB {
  return {
    l: lerp(lab1.l, lab2.l, t),
    a: lerp(lab1.a, lab2.a, t),
    b: lerp(lab1.b, lab2.b, t),
  }
}

/**
 * Interpolate between two colors in HCL space
 */
function interpolateHcl(hcl1: HCL, hcl2: HCL, t: number): HCL {
  // Handle hue interpolation (shortest path)
  const h1 = hcl1.h
  const h2 = hcl2.h
  let dh = h2 - h1

  if (dh > 180) {
    dh -= 360
  } else if (dh < -180) {
    dh += 360
  }

  return {
    h: (h1 + dh * t + 360) % 360,
    c: lerp(hcl1.c, hcl2.c, t),
    l: lerp(hcl1.l, hcl2.l, t),
  }
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
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)

  let resultRgb: RGB

  switch (colorSpace) {
    case 'rgb':
      resultRgb = interpolateRgb(rgb1, rgb2, t)
      break

    case 'hsl': {
      const hsl1 = rgbToHsl(rgb1)
      const hsl2 = rgbToHsl(rgb2)
      const interpolatedHsl = interpolateHsl(hsl1, hsl2, t)
      resultRgb = hslToRgb(interpolatedHsl)
      break
    }

    case 'lab': {
      const lab1 = rgbToLab(rgb1)
      const lab2 = rgbToLab(rgb2)
      const interpolatedLab = interpolateLab(lab1, lab2, t)
      resultRgb = labToRgb(interpolatedLab)
      break
    }

    case 'hcl': {
      const hcl1 = rgbToHcl(rgb1)
      const hcl2 = rgbToHcl(rgb2)
      const interpolatedHcl = interpolateHcl(hcl1, hcl2, t)
      resultRgb = hclToRgb(interpolatedHcl)
      break
    }

    default:
      resultRgb = interpolateRgb(rgb1, rgb2, t)
  }

  return rgbToHex(resultRgb)
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

  const scale: string[] = []

  for (let i = 0; i < steps; i++) {
    const position = i / (steps - 1)
    const segmentIndex = Math.min(Math.floor(position * (colors.length - 1)), colors.length - 2)
    const segmentPosition = (position * (colors.length - 1)) % 1

    const color = interpolateColor(
      colors[segmentIndex],
      colors[segmentIndex + 1],
      segmentPosition,
      colorSpace,
    )
    scale.push(color)
  }

  return scale
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
  const halfSteps = Math.ceil(steps / 2)
  const firstHalf = generateColorScale([startColor, midColor], halfSteps, colorSpace)
  const secondHalf = generateColorScale([midColor, endColor], halfSteps, colorSpace)

  // Avoid duplicating the middle color
  return [...firstHalf.slice(0, -1), ...secondHalf]
}

/**
 * Bezier interpolation for smoother color transitions
 */
export function bezierInterpolate(colors: string[], t: number, colorSpace: ColorSpace = 'lab'): string {
  if (colors.length === 2) {
    return interpolateColor(colors[0], colors[1], t, colorSpace)
  }

  // De Casteljau's algorithm for Bezier curves
  const points = colors.map(hexToRgb)
  let tempPoints = [...points]

  while (tempPoints.length > 1) {
    const newPoints: RGB[] = []
    for (let i = 0; i < tempPoints.length - 1; i++) {
      if (colorSpace === 'rgb') {
        newPoints.push(interpolateRgb(tempPoints[i], tempPoints[i + 1], t))
      } else {
        // Convert to desired color space, interpolate, and convert back
        const color1 = rgbToHex(tempPoints[i])
        const color2 = rgbToHex(tempPoints[i + 1])
        const interpolated = interpolateColor(color1, color2, t, colorSpace)
        newPoints.push(hexToRgb(interpolated))
      }
    }
    tempPoints = newPoints
  }

  return rgbToHex(tempPoints[0])
}

/**
 * Generate a color scale using Bezier interpolation
 */
export function generateBezierColorScale(
  colors: string[],
  steps: number,
  colorSpace: ColorSpace = 'lab',
): string[] {
  const scale: string[] = []

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    scale.push(bezierInterpolate(colors, t, colorSpace))
  }

  return scale
}
