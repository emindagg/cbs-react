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

  const bbox = turf.bbox(points) as [number, number, number, number]
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
        if (dist2 === 0) {
          exactHit = p.v
          break
        }
        const w = 1 / Math.pow(dist2, power / 2)
        weightSum += w
        weightedValue += w * p.v
      }

      values[j * width + i] = exactHit !== null ? exactHit : weightedValue / weightSum
    }
  }

  const { min, max } = computeMinMaxFromPoints(points)

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

  const modelFn = selectVariogramModel(config.krigingModel)
  const variogram = train(vs, xs, ys, modelFn, config.krigingSigma2, config.krigingAlpha)

  const bbox = turf.bbox(points) as [number, number, number, number]
  const { width, height } = computeRasterDimensions(bbox)
  const values = new Float32Array(width * height)

  const lonStep = (bbox[2] - bbox[0]) / Math.max(1, width - 1)
  const latStep = (bbox[3] - bbox[1]) / Math.max(1, height - 1)

  const { min: dataMin } = computeMinMaxFromPoints(points)

  for (let j = 0; j < height; j++) {
    const lat = bbox[3] - j * latStep
    for (let i = 0; i < width; i++) {
      const lon = bbox[0] + i * lonStep
      const p = predict(lon, lat, variogram)
      values[j * width + i] = typeof p === 'number' && !isNaN(p) ? p : dataMin
    }
  }

  const { min, max } = computeMinMaxFromPoints(points)

  return {
    raster: { width, height, bbox, values },
    min,
    max,
  }
}
