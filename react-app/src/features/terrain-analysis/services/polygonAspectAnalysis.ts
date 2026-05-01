import type { MultiPolygon, Polygon } from 'geojson'

import type { AspectDirection, TerrainAspectResult } from '../types'
import { createInitialAspectClasses, getAspectClassColor, getAspectClassIndex } from './aspectClasses'
import {
  analyzePolygonTerrainGrid,
  POLYGON_TERRAIN_MAX_AREA_KM2,
} from './polygonTerrainGrid'

const PERCENT_MULTIPLIER = 100

interface PolygonAspectInput {
  itemId: string
  itemName: string
  geometry: Polygon | MultiPolygon
  forceZoom?: number
  signal?: AbortSignal
}

export function getMaxAspectAnalysisAreaKm2(): number {
  return POLYGON_TERRAIN_MAX_AREA_KM2
}

export async function analyzePolygonAspectFromTerrarium(input: PolygonAspectInput): Promise<TerrainAspectResult> {
  const classes = createInitialAspectClasses()

  const grid = await analyzePolygonTerrainGrid({
    ...input,
    rasterErrorMessage: 'Bakı rasterı üretilemedi',
    onCell: (cell) => {
      const classIndex = getAspectClassIndex(cell.direction)
      classes[classIndex].pixelCount += 1
      return getAspectClassColor(classIndex)
    },
  })

  // Dominant yön: flat hariç en çok piksel. Hiç bakılı piksel yoksa flat döner.
  let dominantDirection: AspectDirection = 'flat'
  let dominantPixels = -1
  let flatPixels = 0
  for (const cls of classes) {
    if (cls.direction === 'flat') {
      flatPixels = cls.pixelCount
      continue
    }
    if (cls.pixelCount > dominantPixels) {
      dominantPixels = cls.pixelCount
      dominantDirection = cls.direction
    }
  }
  if (dominantPixels <= 0) dominantDirection = 'flat'
  const flatPercent = Math.round((flatPixels / grid.insideCount) * PERCENT_MULTIPLIER * 10) / 10

  return {
    itemId: grid.itemId,
    itemName: grid.itemName,
    geometry: grid.geometry,
    areaKm2: Math.round(grid.areaKm2 * 100) / 100,
    raster: grid.raster,
    classes,
    dominantDirection,
    flatPercent,
    tileZoom: grid.tileZoom,
    resolutionMeters: Math.round(grid.resolutionMeters * 10) / 10,
    estimatedTiles: grid.estimatedTiles,
    source: 'aws-terrarium',
  }
}
