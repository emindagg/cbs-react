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
    if (typeof v === 'number' && !isNaN(v)) {
      values.push(v)
      xs.push(lon)
      ys.push(lat)
    }
  }

  if (values.length < 3) {
    throw new Error('Kriging için en az 3 geçerli değere sahip nokta gerekli')
  }

  const modelFn = selectVariogramModel(config.krigingModel)
  const variogram = train(values, xs, ys, modelFn, config.krigingSigma2, config.krigingAlpha)

  const bbox = turf.bbox(points) as [number, number, number, number]
  const grid = buildGrid(bbox, config.cellWidth, config.gridType)

  for (const cell of grid.features) {
    const center = turf.centroid(cell as Feature<Polygon>)
    const [x, y] = center.geometry.coordinates
    const predicted = predict(x, y, variogram)
    if (!cell.properties) cell.properties = {}
    ;(cell.properties as { value: number }).value =
      typeof predicted === 'number' && !isNaN(predicted) ? predicted : NaN
  }

  // Lejant ve renk skalası için gerçek input min/max kullanılır
  const { min, max } = computeMinMaxFromPoints(points)
  sanitizeValues(grid as FeatureCollection<Polygon | Point>, min)

  if (config.gridType === 'isoband') {
    const pointGrid = turf.pointGrid(bbox, config.cellWidth, { units: 'kilometers' }) as FeatureCollection<Point>
    for (const pt of pointGrid.features) {
      const [x, y] = pt.geometry.coordinates
      const predicted = predict(x, y, variogram)
      if (!pt.properties) pt.properties = {}
      ;(pt.properties as { value: number }).value =
        typeof predicted === 'number' && !isNaN(predicted) ? predicted : min
    }
    const gridRange = computeMinMax(pointGrid as FeatureCollection<Polygon | Point>)
    const breaks = computeBreaks(min, max, config.classCount, gridRange)
    const bands = turf.isobands(pointGrid, breaks, { zProperty: 'value' }) as unknown as FeatureCollection<MultiPolygon>
    normalizeIsobandValues(bands)
    return { grid: bands as unknown as AnyGrid, min, max }
  }

  return { grid: grid as FeatureCollection<Polygon | Point>, min, max }
}
