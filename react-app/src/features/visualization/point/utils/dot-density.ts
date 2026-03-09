/**
 * Dot Density — Ortak hesaplama fonksiyonları
 * UI ve renderer aynı dotValue algoritmasını kullanır.
 */

import type { ZoomRadiusExpression } from '@/types/maplibre-expressions'

import { TARGET_TOTAL_DOTS } from '../constants/dot-density'

// Nice number rounding thresholds
const NICE_NUMBER_THRESHOLD_LOW = 1.5
const NICE_NUMBER_THRESHOLD_MID = 3.5
const NICE_NUMBER_THRESHOLD_HIGH = 7.5

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
  if (normalized <= NICE_NUMBER_THRESHOLD_LOW) nice = 1
  else if (normalized <= NICE_NUMBER_THRESHOLD_MID) nice = 2
  else if (normalized <= NICE_NUMBER_THRESHOLD_HIGH) nice = 5
  else nice = 10
  const result = nice * magnitude

  // Ortalamayı geçmesin (her bölge en az 1 nokta alsın)
  return Math.max(1, Math.min(Math.round(result), Math.round(avgValue)))
}

/**
 * Zoom-dependent dot size — MapLibre interpolate expression.
 *   zoom 4  → dotSize × 0.5
 *   zoom 6  → dotSize (referans — Türkiye görünümü)
 *   zoom 10 → dotSize × 3
 */
export function buildZoomRadius(dotSize: number): ZoomRadiusExpression {
  return [
    'interpolate', ['linear'], ['zoom'],
    4, dotSize * 0.5,
    6, dotSize,
    10, dotSize * 3,
  ]
}
