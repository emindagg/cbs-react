/**
 * Dot Density — Ortak hesaplama fonksiyonları
 * UI ve renderer aynı dotValue algoritmasını kullanır.
 */

import { TARGET_TOTAL_DOTS } from '../constants/dot-density'

/**
 * "Nice number" yuvarlama ile akıllı dotValue hesabı.
 * Hem DotDensitySettings (önizleme) hem PointRenderer (fallback) buradan beslenir.
 */
export function calculateSmartDotValue(dataValues: number[]): number {
  if (dataValues.length === 0) return 1

  const totalValue = dataValues.reduce((sum, v) => sum + Math.abs(v), 0)
  const avgValue = totalValue / dataValues.length

  // Hedef ~3000-6000 arası toplam nokta
  const targetDots = Math.min(TARGET_TOTAL_DOTS, dataValues.length * 40)
  const raw = totalValue / targetDots

  // "Güzel sayı"ya yuvarla (1, 2, 5, 10, 20, 50, 100, 200, 500 …)
  if (raw <= 1) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
  const normalized = raw / magnitude
  let nice: number
  if (normalized <= 1.5) nice = 1
  else if (normalized <= 3.5) nice = 2
  else if (normalized <= 7.5) nice = 5
  else nice = 10
  const result = nice * magnitude

  // Ortalamayı geçmesin (her bölge en az 1 nokta alsın)
  return Math.max(1, Math.min(Math.round(result), Math.round(avgValue)))
}

/**
 * Zoom-dependent dot size — MapLibre interpolate expression.
 * ArcGIS referenceScale konseptinin karşılığı:
 *   zoom 4  → dotSize × 0.5
 *   zoom 6  → dotSize (referans — Türkiye görünümü)
 *   zoom 10 → dotSize × 3
 */
export function buildZoomRadius(dotSize: number): unknown[] {
  return [
    'interpolate', ['linear'], ['zoom'],
    4, dotSize * 0.5,
    6, dotSize,
    10, dotSize * 3,
  ]
}
