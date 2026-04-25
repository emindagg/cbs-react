import type { TerrainSlopeClass } from '../types'

// 5 sınıflı eğim renderer (TKGM bazlı, sadeleştirilmiş)
export const SLOPE_CLASS_DEFINITIONS: Omit<TerrainSlopeClass, 'pixelCount'>[] = [
  { min: 0, max: 6, label: '% 0 - 6 (Düz / Hafif)', color: '#1a9850' },
  { min: 6, max: 12, label: '% 6 - 12 (Orta eğimli)', color: '#a6d96a' },
  { min: 12, max: 20, label: '% 12 - 20 (Dik)', color: '#fee08b' },
  { min: 20, max: 30, label: '% 20 - 30 (Çok dik)', color: '#fdae61' },
  { min: 30, max: null, label: '% 30+ (Sarp)', color: '#d73027' },
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
