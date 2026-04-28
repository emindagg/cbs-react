import type { AspectDirection, TerrainAspectClass } from '../types'

const GREEN_SHIFT = 8

// ArcGIS standart aspect color wheel: yön çemberinde komşu yönler renk çemberinde de komşu.
// Sıralama "Düz" en başta, ardından Kuzeybatı'dan saat yönünde dönen pusula döngüsü.
// Bu sayede lejant okurken pusulanın doğal döngüsü korunur (KB ve K yan yana kalır).
export const ASPECT_CLASS_DEFINITIONS: Omit<TerrainAspectClass, 'pixelCount'>[] = [
  { direction: 'flat', label: 'Düz', color: '#a9a9a9', fromDeg: -1, toDeg: -1 },
  { direction: 'northwest', label: 'Kuzeybatı', color: '#9900ff', fromDeg: 292.5, toDeg: 337.5 },
  { direction: 'north', label: 'Kuzey', color: '#ff0000', fromDeg: 337.5, toDeg: 22.5 },
  { direction: 'northeast', label: 'Kuzeydoğu', color: '#ff8c00', fromDeg: 22.5, toDeg: 67.5 },
  { direction: 'east', label: 'Doğu', color: '#ffff00', fromDeg: 67.5, toDeg: 112.5 },
  { direction: 'southeast', label: 'Güneydoğu', color: '#9aff00', fromDeg: 112.5, toDeg: 157.5 },
  { direction: 'south', label: 'Güney', color: '#00ff00', fromDeg: 157.5, toDeg: 202.5 },
  { direction: 'southwest', label: 'Güneybatı', color: '#00ffff', fromDeg: 202.5, toDeg: 247.5 },
  { direction: 'west', label: 'Batı', color: '#0099ff', fromDeg: 247.5, toDeg: 292.5 },
]

export function createInitialAspectClasses(): TerrainAspectClass[] {
  return ASPECT_CLASS_DEFINITIONS.map((item) => ({ ...item, pixelCount: 0 }))
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex
  const value = parseInt(normalized, 16)
  return [(value >> 16) & 255, (value >> GREEN_SHIFT) & 255, value & 255]
}

export function getAspectClassIndex(direction: AspectDirection): number {
  const idx = ASPECT_CLASS_DEFINITIONS.findIndex((item) => item.direction === direction)
  return idx >= 0 ? idx : 0
}

export function getAspectClassColor(index: number): [number, number, number] {
  return hexToRgb(ASPECT_CLASS_DEFINITIONS[index]?.color ?? ASPECT_CLASS_DEFINITIONS[0].color)
}
