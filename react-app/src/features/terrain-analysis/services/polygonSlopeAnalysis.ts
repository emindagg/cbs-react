import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

import type { TerrainSlopeResult } from '../types'
import { createInitialSlopeClasses, getSlopeClassColor, getSlopeClassIndex } from './slopeClasses'
import { calculateAspectFromElevationGrid, clampTerrainZoom, DEFAULT_TERRAIN_ZOOM, groundResolutionMeters, lngLatToGlobalPixel } from './terrainMath'
import { readTerrariumElevationAtGlobalPixel } from './terrainTiles'

const MAX_ANALYSIS_AREA_KM2 = 25
const MAX_RASTER_DIMENSION = 256
const MIN_RASTER_DIMENSION = 32
const ALPHA_INSIDE = 220
const ALPHA_OUTSIDE = 0
const MAX_SAMPLE_GRID = MAX_RASTER_DIMENSION + 2

interface PolygonSlopeInput {
  itemId: string
  itemName: string
  geometry: Polygon | MultiPolygon
  zoom?: number
  signal?: AbortSignal
}

interface Dimensions {
  width: number
  height: number
}

function computeDimensions(bbox: [number, number, number, number]): Dimensions {
  const [west, south, east, north] = bbox
  const midLat = (south + north) / 2
  const widthMeters = Math.max(1, turf.distance([west, midLat], [east, midLat], { units: 'kilometers' }) * 1000)
  const heightMeters = Math.max(1, turf.distance([west, south], [west, north], { units: 'kilometers' }) * 1000)
  const aspect = widthMeters / heightMeters

  if (aspect >= 1) {
    return {
      width: MAX_RASTER_DIMENSION,
      height: Math.max(MIN_RASTER_DIMENSION, Math.round(MAX_RASTER_DIMENSION / aspect)),
    }
  }

  return {
    width: Math.max(MIN_RASTER_DIMENSION, Math.round(MAX_RASTER_DIMENSION * aspect)),
    height: MAX_RASTER_DIMENSION,
  }
}

function createCanvasDataUrl(width: number, height: number, data: Uint8ClampedArray): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Eğim rasterı üretilemedi')
  const image = ctx.createImageData(width, height)
  image.data.set(data)
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

function getSampleIndex(x: number, y: number, sampleWidth: number): number {
  return y * sampleWidth + x
}

export function getMaxSlopeAnalysisAreaKm2(): number {
  return MAX_ANALYSIS_AREA_KM2
}

export async function analyzePolygonSlopeFromTerrarium(input: PolygonSlopeInput): Promise<TerrainSlopeResult> {
  const feature: Feature<Polygon | MultiPolygon> = {
    type: 'Feature',
    geometry: input.geometry,
    properties: {},
  }
  const areaKm2 = turf.area(feature) / 1_000_000
  if (areaKm2 > MAX_ANALYSIS_AREA_KM2) {
    throw new Error(`Alan çok büyük. Eğim analizi için en fazla ${MAX_ANALYSIS_AREA_KM2} km² seçilebilir.`)
  }

  const bbox = turf.bbox(feature) as [number, number, number, number]
  const [west, south, east, north] = bbox
  if (east <= west || north <= south) {
    throw new Error('Geçerli bir polygon alanı seçin.')
  }

  const tileZoom = clampTerrainZoom(input.zoom ?? DEFAULT_TERRAIN_ZOOM)
  const { width, height } = computeDimensions(bbox)
  const sampleWidth = width + 2
  const sampleHeight = height + 2
  if (sampleWidth > MAX_SAMPLE_GRID || sampleHeight > MAX_SAMPLE_GRID) {
    throw new Error('Analiz çözünürlüğü sınırı aşıldı.')
  }

  const nw = lngLatToGlobalPixel(west, north, tileZoom)
  const se = lngLatToGlobalPixel(east, south, tileZoom)
  const globalStepX = (se.x - nw.x) / Math.max(1, width - 1)
  const globalStepY = (se.y - nw.y) / Math.max(1, height - 1)
  const elevations = new Float32Array(sampleWidth * sampleHeight)

  for (let y = 0; y < sampleHeight; y++) {
    for (let x = 0; x < sampleWidth; x++) {
      const globalX = nw.x + (x - 1) * globalStepX
      const globalY = nw.y + (y - 1) * globalStepY
      elevations[getSampleIndex(x, y, sampleWidth)] = await readTerrariumElevationAtGlobalPixel(
        globalX,
        globalY,
        tileZoom,
        input.signal,
      )
    }
  }

  const classes = createInitialSlopeClasses()
  const imageData = new Uint8ClampedArray(width * height * 4)
  const cellSizeMeters = Math.max(1, groundResolutionMeters((south + north) / 2, tileZoom))
  let minSlope = Infinity
  let maxSlope = -Infinity
  let slopeSum = 0
  let insideCount = 0

  for (let y = 0; y < height; y++) {
    const lat = north - ((y + 0.5) / height) * (north - south)
    for (let x = 0; x < width; x++) {
      const lng = west + ((x + 0.5) / width) * (east - west)
      const pixelIndex = (y * width + x) * 4
      const inside = turf.booleanPointInPolygon(turf.point([lng, lat]), feature)
      if (!inside) {
        imageData[pixelIndex + 3] = ALPHA_OUTSIDE
        continue
      }

      const sx = x + 1
      const sy = y + 1
      const slope = calculateAspectFromElevationGrid([
        [
          elevations[getSampleIndex(sx - 1, sy - 1, sampleWidth)],
          elevations[getSampleIndex(sx, sy - 1, sampleWidth)],
          elevations[getSampleIndex(sx + 1, sy - 1, sampleWidth)],
        ],
        [
          elevations[getSampleIndex(sx - 1, sy, sampleWidth)],
          elevations[getSampleIndex(sx, sy, sampleWidth)],
          elevations[getSampleIndex(sx + 1, sy, sampleWidth)],
        ],
        [
          elevations[getSampleIndex(sx - 1, sy + 1, sampleWidth)],
          elevations[getSampleIndex(sx, sy + 1, sampleWidth)],
          elevations[getSampleIndex(sx + 1, sy + 1, sampleWidth)],
        ],
      ], cellSizeMeters).slopePercent

      const classIndex = getSlopeClassIndex(slope)
      const [r, g, b] = getSlopeClassColor(classIndex)
      classes[classIndex].pixelCount += 1
      imageData[pixelIndex] = r
      imageData[pixelIndex + 1] = g
      imageData[pixelIndex + 2] = b
      imageData[pixelIndex + 3] = ALPHA_INSIDE

      minSlope = Math.min(minSlope, slope)
      maxSlope = Math.max(maxSlope, slope)
      slopeSum += slope
      insideCount += 1
    }
  }

  if (insideCount === 0) {
    throw new Error('Polygon içinde analiz edilebilir hücre bulunamadı.')
  }

  return {
    itemId: input.itemId,
    itemName: input.itemName,
    geometry: input.geometry,
    areaKm2: Math.round(areaKm2 * 100) / 100,
    raster: {
      width,
      height,
      bbox,
      imageDataUrl: createCanvasDataUrl(width, height, imageData),
    },
    classes,
    minSlopePercent: Math.round(minSlope * 10) / 10,
    maxSlopePercent: Math.round(maxSlope * 10) / 10,
    avgSlopePercent: Math.round((slopeSum / insideCount) * 10) / 10,
    tileZoom,
    source: 'aws-terrarium',
  }
}
