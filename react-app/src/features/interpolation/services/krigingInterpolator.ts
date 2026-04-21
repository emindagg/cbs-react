import {
  train,
  predict,
  variogramExponential,
  variogramGaussian,
  variogramSpherical,
} from '@sakitam-gis/kriging'
import * as turf from '@turf/turf'
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson'

import type { InterpolationConfig, KrigingModel } from '../types'
import { computeBreaks, computeMinMax, computeMinMaxFromPoints, normalizeIsobandValues, sanitizeValues } from './idwInterpolator'

type AnyGrid = FeatureCollection<Polygon | MultiPolygon | Point>

interface KrigingResult {
  grid: AnyGrid
  min: number
  max: number
}

function selectVariogramModel(model: KrigingModel) {
  switch (model) {
    case 'gaussian': return variogramGaussian
    case 'spherical': return variogramSpherical
    case 'exponential':
    default: return variogramExponential
  }
}

function buildGrid(
  bbox: [number, number, number, number],
  cellWidth: number,
  gridType: InterpolationConfig['gridType'],
): FeatureCollection<Polygon> {
  switch (gridType) {
    case 'hex':
      return turf.hexGrid(bbox, cellWidth, { units: 'kilometers' }) as FeatureCollection<Polygon>
    case 'triangle':
      return turf.triangleGrid(bbox, cellWidth, { units: 'kilometers' }) as FeatureCollection<Polygon>
    case 'isoband':
    case 'square':
    default:
      return turf.squareGrid(bbox, cellWidth, { units: 'kilometers' }) as FeatureCollection<Polygon>
  }
}

function trainVariogramSafe(
  values: number[],
  xs: number[],
  ys: number[],
  modelFn: ReturnType<typeof selectVariogramModel>,
  sigma2: number,
  alpha: number,
): ReturnType<typeof train> {
  try {
    const variogram = train(values, xs, ys, modelFn, sigma2, alpha)
    // Variogram parametrelerinin finite olduğunu doğrula — singular/ill-conditioned
    // matrislerde kütüphane sessizce NaN döndürebiliyor.
    const v = variogram as unknown as Record<string, unknown>
    const check = (k: string) => {
      const n = v?.[k]
      return typeof n !== 'number' || !isFinite(n)
    }
    if (check('nugget') || check('range') || check('sill')) {
      throw new Error('variogram-invalid')
    }
    return variogram
  } catch {
    throw new Error(
      'Kriging modeli eğitilemedi: noktalar çok yakın, değerler sabit veya yetersiz varyans. Lütfen farklı konum/değerli noktalar deneyin.',
    )
  }
}

export function interpolateKriging(
  points: FeatureCollection<Point>,
  config: InterpolationConfig,
): KrigingResult {
  if (points.features.length < 3) {
    throw new Error('Kriging için en az 3 nokta gerekli')
  }

  const values: number[] = []
  const xs: number[] = []
  const ys: number[] = []

  for (const feature of points.features) {
    const v = (feature.properties as { value?: number } | null)?.value
    const [lon, lat] = feature.geometry.coordinates
    if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
      values.push(v)
      xs.push(lon)
      ys.push(lat)
    }
  }

  if (values.length < 3) {
    throw new Error('Kriging için en az 3 geçerli değere sahip nokta gerekli')
  }
  const uniqueValues = new Set(values)
  if (uniqueValues.size < 2) {
    throw new Error('Kriging için en az 2 farklı değere sahip nokta gerekli (tüm değerler eşit)')
  }

  const modelFn = selectVariogramModel(config.krigingModel)
  const variogram = trainVariogramSafe(values, xs, ys, modelFn, config.krigingSigma2, config.krigingAlpha)

  // Lejant ve renk skalası için gerçek input min/max; fallback için önce hesapla
  const { min, max } = computeMinMaxFromPoints(points)

  const bbox = turf.bbox(points) as [number, number, number, number]
  const grid = buildGrid(bbox, config.cellWidth, config.gridType)

  for (const cell of grid.features) {
    const center = turf.centroid(cell as Feature<Polygon>)
    const [x, y] = center.geometry.coordinates
    const predicted = predict(x, y, variogram)
    if (!cell.properties) cell.properties = {}
    ;(cell.properties as { value: number }).value =
      typeof predicted === 'number' && isFinite(predicted) ? predicted : min
  }

  sanitizeValues(grid as FeatureCollection<Polygon | Point>, min)

  if (config.gridType === 'isoband') {
    const pointGrid = turf.pointGrid(bbox, config.cellWidth, { units: 'kilometers' }) as FeatureCollection<Point>
    if (pointGrid.features.length === 0) {
      throw new Error('İsoband için nokta ızgarası boş: hücre genişliği çok büyük veya alan çok küçük')
    }
    for (const pt of pointGrid.features) {
      const [x, y] = pt.geometry.coordinates
      const predicted = predict(x, y, variogram)
      if (!pt.properties) pt.properties = {}
      ;(pt.properties as { value: number }).value =
        typeof predicted === 'number' && isFinite(predicted) ? predicted : min
    }
    const gridRange = computeMinMax(pointGrid as FeatureCollection<Polygon | Point>)
    const breaks = computeBreaks(min, max, config.classCount, gridRange)
    if (breaks.length < 2) {
      throw new Error('İsoband oluşturmak için yeterli kırılma noktası yok (değer aralığı çok dar)')
    }
    let bands: FeatureCollection<MultiPolygon>
    try {
      bands = turf.isobands(pointGrid, breaks, { zProperty: 'value' }) as unknown as FeatureCollection<MultiPolygon>
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`İsoband oluşturulamadı: ${msg}`)
    }
    normalizeIsobandValues(bands)
    return { grid: bands as unknown as AnyGrid, min, max }
  }

  return { grid: grid as FeatureCollection<Polygon | Point>, min, max }
}
