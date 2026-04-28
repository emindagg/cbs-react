import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

import type { AspectDirection, TerrainAspectResult } from '../types'
import { createInitialAspectClasses, getAspectClassColor, getAspectClassIndex } from './aspectClasses'
import {
  calculateAspectFromElevationGrid,
  groundResolutionMeters,
  lngLatToGlobalPixel,
  MAX_TILES_PER_ANALYSIS,
  selectLODForArea,
} from './terrainMath'
import { readTerrariumElevationAtGlobalPixel } from './terrainTiles'

const ABSOLUTE_MAX_AREA_KM2 = 10000
const MIN_RASTER_DIMENSION = 64
const MAX_RASTER_DIMENSION = 640
const ALPHA_INSIDE = 255
const ALPHA_OUTSIDE = 0
const PERCENT_MULTIPLIER = 100

interface PolygonAspectInput {
  itemId: string
  itemName: string
  geometry: Polygon | MultiPolygon
  forceZoom?: number
  signal?: AbortSignal
}

function createCanvasDataUrl(width: number, height: number, data: Uint8ClampedArray): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Bakı rasterı üretilemedi')
  const image = ctx.createImageData(width, height)
  image.data.set(data)
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

function getSampleIndex(x: number, y: number, sampleWidth: number): number {
  return y * sampleWidth + x
}

export function getMaxAspectAnalysisAreaKm2(): number {
  return ABSOLUTE_MAX_AREA_KM2
}

export async function analyzePolygonAspectFromTerrarium(input: PolygonAspectInput): Promise<TerrainAspectResult> {
  const feature: Feature<Polygon | MultiPolygon> = {
    type: 'Feature',
    geometry: input.geometry,
    properties: {},
  }
  const areaKm2 = turf.area(feature) / 1_000_000
  if (areaKm2 > ABSOLUTE_MAX_AREA_KM2) {
    throw new Error(`Alan çok büyük (${areaKm2.toFixed(0)} km²). Maksimum ${ABSOLUTE_MAX_AREA_KM2} km².`)
  }

  const bbox = turf.bbox(feature) as [number, number, number, number]
  const [west, south, east, north] = bbox
  if (east <= west || north <= south) {
    throw new Error('Geçerli bir polygon alanı seçin.')
  }

  const midLat = (south + north) / 2
  const widthMeters = Math.max(1, turf.distance([west, midLat], [east, midLat], { units: 'kilometers' }) * 1000)
  const heightMeters = Math.max(1, turf.distance([west, south], [west, north], { units: 'kilometers' }) * 1000)
  const aspectRatio = widthMeters / heightMeters

  const lod = selectLODForArea(areaKm2, midLat, {
    aspectRatio,
    maxTiles: MAX_TILES_PER_ANALYSIS,
  })
  const tileZoom = input.forceZoom ?? lod.zoom

  const width = Math.min(MAX_RASTER_DIMENSION, Math.max(MIN_RASTER_DIMENSION, lod.rasterWidth))
  const height = Math.min(MAX_RASTER_DIMENSION, Math.max(MIN_RASTER_DIMENSION, lod.rasterHeight))
  const sampleWidth = width + 2
  const sampleHeight = height + 2

  const nw = lngLatToGlobalPixel(west, north, tileZoom)
  const se = lngLatToGlobalPixel(east, south, tileZoom)
  const globalStepX = (se.x - nw.x) / Math.max(1, width - 1)
  const globalStepY = (se.y - nw.y) / Math.max(1, height - 1)
  const elevations = new Float32Array(sampleWidth * sampleHeight)

  for (let y = 0; y < sampleHeight; y++) {
    if (input.signal?.aborted) throw new Error('İptal edildi')
    const rowPromises: Promise<void>[] = []
    for (let x = 0; x < sampleWidth; x++) {
      const globalX = nw.x + (x - 1) * globalStepX
      const globalY = nw.y + (y - 1) * globalStepY
      const idx = getSampleIndex(x, y, sampleWidth)
      rowPromises.push(
        readTerrariumElevationAtGlobalPixel(globalX, globalY, tileZoom, input.signal).then((value) => {
          elevations[idx] = value
        }),
      )
    }
    await Promise.all(rowPromises)
  }

  const classes = createInitialAspectClasses()
  const imageData = new Uint8ClampedArray(width * height * 4)
  const cellSizeMeters = Math.max(1, groundResolutionMeters(midLat, tileZoom))
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
      const aspect = calculateAspectFromElevationGrid([
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
      ], cellSizeMeters)

      const classIndex = getAspectClassIndex(aspect.direction)
      const [r, g, b] = getAspectClassColor(classIndex)
      classes[classIndex].pixelCount += 1
      imageData[pixelIndex] = r
      imageData[pixelIndex + 1] = g
      imageData[pixelIndex + 2] = b
      imageData[pixelIndex + 3] = ALPHA_INSIDE

      insideCount += 1
    }
  }

  if (insideCount === 0) {
    throw new Error('Polygon içinde analiz edilebilir hücre bulunamadı.')
  }

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
  const flatPercent = Math.round((flatPixels / insideCount) * PERCENT_MULTIPLIER * 10) / 10

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
    dominantDirection,
    flatPercent,
    tileZoom,
    resolutionMeters: Math.round(cellSizeMeters * 10) / 10,
    estimatedTiles: lod.estimatedTiles,
    source: 'aws-terrarium',
  }
}
