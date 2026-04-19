import * as turf from '@turf/turf'
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson'

import type { InterpolationConfig } from '../types'

type AnyGrid = FeatureCollection<Polygon | MultiPolygon | Point>

interface IDWResult {
  grid: AnyGrid
  min: number
  max: number
}

export function interpolateIDW(
  points: FeatureCollection<Point>,
  config: InterpolationConfig,
): IDWResult {
  // 'smooth' worker tarafında raster ile ele alınır; buraya geldiğinde fallback square.
  const baseGridType: 'point' | 'square' | 'hex' | 'triangle' =
    config.gridType === 'isoband' ? 'point'
    : config.gridType === 'smooth' ? 'square'
    : config.gridType

  const raw = turf.interpolate(points, config.cellWidth, {
    gridType: baseGridType,
    property: 'value',
    units: 'kilometers',
    weight: config.idwPower,
  }) as unknown as AnyGrid

  // Lejant ve renk skalası için gerçek input nokta verisinin min/max'ı kullanılır.
  // Grid değerleri (interpolated) genelde daha dar aralıkta kalır, bu yüzden onları
  // göstermek yanıltıcı olur.
  const { min, max } = computeMinMaxFromPoints(points)
  sanitizeValues(raw, min)

  if (config.gridType === 'isoband') {
    const gridRange = computeMinMax(raw)
    const breaks = computeBreaks(min, max, config.classCount, gridRange)
    const bandsFc = turf.isobands(raw as unknown as FeatureCollection<Point>, breaks, { zProperty: 'value' }) as unknown as FeatureCollection<MultiPolygon>
    normalizeIsobandValues(bandsFc)
    return { grid: bandsFc as unknown as AnyGrid, min, max }
  }

  return { grid: raw, min, max }
}

export function computeMinMaxFromPoints(fc: FeatureCollection<Point>): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const f of fc.features) {
    const v = (f.properties as { value?: number } | null)?.value
    if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  if (min === Infinity) return { min: 0, max: 1 }
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.05 : 1
    return { min: min - pad, max: max + pad }
  }
  return { min, max }
}

export function computeMinMax(fc: AnyGrid): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const f of fc.features) {
    const v = (f.properties as { value?: number } | null)?.value
    if (typeof v === 'number' && !isNaN(v)) {
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  if (min === Infinity) return { min: 0, max: 100 }
  if (min === max) return { min: min - 1, max: max + 1 }
  return { min, max }
}

export function sanitizeValues(fc: AnyGrid, fallback: number): void {
  for (const f of fc.features) {
    const props = f.properties as { value?: number } | null
    const v = props?.value
    if (v === null || v === undefined || isNaN(v as number)) {
      if (f.properties) (f.properties as { value: number }).value = fallback
    }
  }
}

export function computeBreaks(
  min: number,
  max: number,
  classCount: number,
  gridRange?: { min: number; max: number },
): number[] {
  const count = Math.max(3, Math.min(classCount, 15))
  const step = (max - min) / count
  const safeStep = Math.abs(step) > 0 ? Math.abs(step) : 1

  // Bantların grid değerlerinin tamamını kapsamasını garantilemek için
  // alt/üst tarafa interpolated grid'in ekstrem değerlerini dahil et.
  const lower = gridRange ? Math.min(gridRange.min, min) - safeStep : min - safeStep
  const upper = gridRange ? Math.max(gridRange.max, max) + safeStep : max + safeStep

  const breaks: number[] = [lower]
  for (let i = 0; i <= count; i++) breaks.push(min + i * step)
  breaks.push(upper)

  // Tekrar eden kırılma noktalarını filtrele (turf.isobands hata vermesin)
  const unique: number[] = []
  for (const b of breaks) {
    if (unique.length === 0 || b > unique[unique.length - 1]) unique.push(b)
  }
  return unique
}

export function normalizeIsobandValues(fc: FeatureCollection<Polygon | MultiPolygon>): void {
  for (const f of fc.features as Feature<Polygon | MultiPolygon>[]) {
    const raw = (f.properties as { value?: string | number } | null)?.value
    if (typeof raw === 'string') {
      const lower = raw.split('-')[0]
      const num = parseFloat(lower)
      if (!isNaN(num) && f.properties) {
        (f.properties as { value: number }).value = num
      }
    }
  }
}
