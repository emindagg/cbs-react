import type { TerrainSlopeClass } from '../types'

export const SLOPE_CLASS_DEFINITIONS: Omit<TerrainSlopeClass, 'pixelCount'>[] = [
  { min: 0, max: 10, label: '% 0 - 10', color: '#00c837' },
  { min: 10, max: 20, label: '% 10 - 20', color: '#7ee329' },
  { min: 20, max: 30, label: '% 20 - 30', color: '#fff21a' },
  { min: 30, max: 40, label: '% 30 - 40', color: '#ff8c1a' },
  { min: 40, max: null, label: '% 40+', color: '#ff1616' },
]

const GREEN_SHIFT = 8

export function createInitialSlopeClasses(): TerrainSlopeClass[] {
  return SLOPE_CLASS_DEFINITIONS.map((item) => ({ ...item, pixelCount: 0 }))
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex
  const value = parseInt(normalized, 16)
  return [(value >> 16) & 255, (value >> GREEN_SHIFT) & 255, value & 255]
}

export function getSlopeClassIndex(slopePercent: number): number {
  const idx = SLOPE_CLASS_DEFINITIONS.findIndex((item) => (
    slopePercent >= item.min && (item.max === null || slopePercent < item.max)
  ))
  return idx >= 0 ? idx : SLOPE_CLASS_DEFINITIONS.length - 1
}

export function getSlopeClassColor(index: number): [number, number, number] {
  return hexToRgb(SLOPE_CLASS_DEFINITIONS[index]?.color ?? SLOPE_CLASS_DEFINITIONS[0].color)
}
