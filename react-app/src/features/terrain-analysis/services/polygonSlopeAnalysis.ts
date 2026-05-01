import type { MultiPolygon, Polygon } from 'geojson'

import type { TerrainSlopeResult } from '../types'
import {
  analyzePolygonTerrainGrid,
  POLYGON_TERRAIN_MAX_AREA_KM2,
} from './polygonTerrainGrid'
import { createInitialSlopeClasses, getSlopeClassColor, getSlopeClassIndex } from './slopeClasses'

interface PolygonSlopeInput {
  itemId: string
  itemName: string
  geometry: Polygon | MultiPolygon
  forceZoom?: number
  signal?: AbortSignal
}

export function getMaxSlopeAnalysisAreaKm2(): number {
  return POLYGON_TERRAIN_MAX_AREA_KM2
}

export async function analyzePolygonSlopeFromTerrarium(input: PolygonSlopeInput): Promise<TerrainSlopeResult> {
  const classes = createInitialSlopeClasses()
  let minSlope = Infinity
  let maxSlope = -Infinity
  let slopeSum = 0

  const grid = await analyzePolygonTerrainGrid({
    ...input,
    rasterErrorMessage: 'Eğim rasterı üretilemedi',
    onCell: (cell) => {
      const slope = cell.slopePercent
      const classIndex = getSlopeClassIndex(slope)
      classes[classIndex].pixelCount += 1
      minSlope = Math.min(minSlope, slope)
      maxSlope = Math.max(maxSlope, slope)
      slopeSum += slope
      return getSlopeClassColor(classIndex)
    },
  })

  return {
    itemId: grid.itemId,
    itemName: grid.itemName,
    geometry: grid.geometry,
    areaKm2: Math.round(grid.areaKm2 * 100) / 100,
    raster: grid.raster,
    classes,
    minSlopePercent: Math.round(minSlope * 10) / 10,
    maxSlopePercent: Math.round(maxSlope * 10) / 10,
    avgSlopePercent: Math.round((slopeSum / grid.insideCount) * 10) / 10,
    tileZoom: grid.tileZoom,
    resolutionMeters: Math.round(grid.resolutionMeters * 10) / 10,
    estimatedTiles: grid.estimatedTiles,
    source: 'aws-terrarium',
  }
}
