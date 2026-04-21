import {
  predict,
  train,
  variogramExponential,
  variogramGaussian,
  variogramSpherical,
} from '@sakitam-gis/kriging'
import * as turf from '@turf/turf'
import type { FeatureCollection, Point } from 'geojson'

import type { InterpolationConfig, InterpolationRaster, KrigingModel } from '../types'
import { computeMinMaxFromPoints } from './idwInterpolator'

const MAX_DIM = 384
// Aynı konumlu nokta sayılan eşik (derece²) — floating-point tam eşitlik güvenilmez
const DISTANCE_EPSILON_SQ = 1e-18

export interface RasterResult {
  raster: InterpolationRaster
  min: number
  max: number
}

function selectVariogramModel(model: KrigingModel) {
  switch (model) {
    case 'gaussian':
      return variogramGaussian
    case 'spherical':
      return variogramSpherical
    case 'exponential':
    default:
      return variogramExponential
  }
}

// bbox ve aspect ratio'ya göre uygun (width, height) seç. Toplam piksel ~MAX_DIM*MAX_DIM altında.
function computeRasterDimensions(bbox: [number, number, number, number]): {
  width: number
  height: number
} {
  const w = Math.max(1e-9, bbox[2] - bbox[0])
  const h = Math.max(1e-9, bbox[3] - bbox[1])
  // Enlem etkisini de hesaba kat (cos(lat)) — daha doğru en/boy oranı
  const midLat = (bbox[1] + bbox[3]) / 2
  const aspect = (w * Math.cos((midLat * Math.PI) / 180)) / h

  let width: number
  let height: number
  if (aspect >= 1) {
    width = MAX_DIM
    height = Math.max(16, Math.round(MAX_DIM / aspect))
  } else {
    height = MAX_DIM
    width = Math.max(16, Math.round(MAX_DIM * aspect))
  }
  return { width, height }
}

interface NumericPoint {
  x: number
  y: number
  v: number
}

function extractNumericPoints(points: FeatureCollection<Point>): NumericPoint[] {
  const out: NumericPoint[] = []
  for (const f of points.features) {
    const v = (f.properties as { value?: number } | null)?.value
    const [x, y] = f.geometry.coordinates
    if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
      out.push({ x, y, v })
    }
  }
  return out
}

export function interpolateIDWRaster(
  points: FeatureCollection<Point>,
  config: InterpolationConfig,
): RasterResult {
  const numericPoints = extractNumericPoints(points)
  if (numericPoints.length === 0) {
    throw new Error('Geçerli nokta bulunamadı')
  }

  const { min, max } = computeMinMaxFromPoints(points)
  if (!isFinite(min) || !isFinite(max)) {
    throw new Error('Geçerli minimum/maksimum değer hesaplanamadı')
  }

  // Tüm noktalar tek konumda ise raster anlamsız olur (bbox alanı 0)
  const bbox = turf.bbox(points) as [number, number, number, number]
  if (!isFinite(bbox[0]) || !isFinite(bbox[2]) || bbox[2] - bbox[0] <= 0 || bbox[3] - bbox[1] <= 0) {
    throw new Error('Nokta dağılımı çok dar: enterpolasyon için geçerli bir alan oluşturulamıyor')
  }

  const { width, height } = computeRasterDimensions(bbox)
  const values = new Float32Array(width * height)

  const power = config.idwPower
  const lonStep = (bbox[2] - bbox[0]) / Math.max(1, width - 1)
  const latStep = (bbox[3] - bbox[1]) / Math.max(1, height - 1)

  for (let j = 0; j < height; j++) {
    // Üst-sol (kuzey-batı) köşeden başla → top-down doldur
    const lat = bbox[3] - j * latStep
    for (let i = 0; i < width; i++) {
      const lon = bbox[0] + i * lonStep
      let weightSum = 0
      let weightedValue = 0
      let exactHit: number | null = null

      for (const p of numericPoints) {
        const dx = p.x - lon
        const dy = p.y - lat
        const dist2 = dx * dx + dy * dy
        // Epsilon eşiği: floating-point hassasiyeti nedeniyle tam sıfır kontrolü güvenilmez.
        // Yakın noktalarda dist2 → 0 olur ve 1/pow(dist2, power/2) → Infinity üretir.
        if (dist2 < DISTANCE_EPSILON_SQ) {
          exactHit = p.v
          break
        }
        const w = 1 / Math.pow(dist2, power / 2)
        weightSum += w
        weightedValue += w * p.v
      }

      let cellValue: number
      if (exactHit !== null) {
        cellValue = exactHit
      } else if (weightSum > 0 && isFinite(weightSum)) {
        cellValue = weightedValue / weightSum
      } else {
        // weightSum = 0 ya da Infinity: fallback olarak dataMin (lejant dışına çıkmasın)
        cellValue = min
      }
      values[j * width + i] = isFinite(cellValue) ? cellValue : min
    }
  }

  return {
    raster: { width, height, bbox, values },
    min,
    max,
  }
}

export function interpolateKrigingRaster(
  points: FeatureCollection<Point>,
  config: InterpolationConfig,
): RasterResult {
  const numericPoints = extractNumericPoints(points)
  if (numericPoints.length < 3) {
    throw new Error('Kriging için en az 3 geçerli değere sahip nokta gerekli')
  }

  const xs = numericPoints.map((p) => p.x)
  const ys = numericPoints.map((p) => p.y)
  const vs = numericPoints.map((p) => p.v)

  if (new Set(vs).size < 2) {
    throw new Error('Kriging için en az 2 farklı değere sahip nokta gerekli (tüm değerler eşit)')
  }

  const { min, max } = computeMinMaxFromPoints(points)
  if (!isFinite(min) || !isFinite(max)) {
    throw new Error('Geçerli minimum/maksimum değer hesaplanamadı')
  }

  const bbox = turf.bbox(points) as [number, number, number, number]
  if (!isFinite(bbox[0]) || !isFinite(bbox[2]) || bbox[2] - bbox[0] <= 0 || bbox[3] - bbox[1] <= 0) {
    throw new Error('Nokta dağılımı çok dar: enterpolasyon için geçerli bir alan oluşturulamıyor')
  }

  const modelFn = selectVariogramModel(config.krigingModel)
  let variogram: ReturnType<typeof train>
  try {
    variogram = train(vs, xs, ys, modelFn, config.krigingSigma2, config.krigingAlpha)
    const v = variogram as unknown as Record<string, unknown>
    const check = (k: string) => {
      const n = v?.[k]
      return typeof n !== 'number' || !isFinite(n)
    }
    if (check('nugget') || check('range') || check('sill')) {
      throw new Error('variogram-invalid')
    }
  } catch {
    throw new Error(
      'Kriging modeli eğitilemedi: noktalar çok yakın, değerler sabit veya yetersiz varyans. Lütfen farklı konum/değerli noktalar deneyin.',
    )
  }

  const { width, height } = computeRasterDimensions(bbox)
  const values = new Float32Array(width * height)

  const lonStep = (bbox[2] - bbox[0]) / Math.max(1, width - 1)
  const latStep = (bbox[3] - bbox[1]) / Math.max(1, height - 1)

  for (let j = 0; j < height; j++) {
    const lat = bbox[3] - j * latStep
    for (let i = 0; i < width; i++) {
      const lon = bbox[0] + i * lonStep
      const p = predict(lon, lat, variogram)
      values[j * width + i] = typeof p === 'number' && isFinite(p) ? p : min
    }
  }

  return {
    raster: { width, height, bbox, values },
    min,
    max,
  }
}
