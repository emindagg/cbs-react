import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

import type { AspectComputation } from './terrainMath'
import {
  calculateAspectFromElevationGrid,
  groundResolutionMeters,
  lngLatToGlobalPixel,
  MAX_TILES_PER_ANALYSIS,
  selectLODForArea,
} from './terrainMath'
import { readTerrariumElevationAtGlobalPixel } from './terrainTiles'

// Tile patlamasını engellemek için üst sınır. LOD sistemi sayesinde pratikte
// ulaşılmaz; çok büyük alanlarda zoom otomatik düşer.
const ABSOLUTE_MAX_AREA_KM2 = 10000
const MIN_RASTER_DIMENSION = 64
const MAX_RASTER_DIMENSION = 640
// DEM native pixel başına izin verilen analiz cell sayısı. Bilinear sampling ile
// 2× oversampling pürüzsüz görüntü üretir; daha yükseği gereksiz hesap maliyetidir.
const MAX_OVERSAMPLE_FACTOR = 2
const ALPHA_INSIDE = 255
const ALPHA_OUTSIDE = 0
const EARTH_RADIUS_M = 6_378_137
const DEG_TO_RAD = Math.PI / 180

export const POLYGON_TERRAIN_MAX_AREA_KM2 = ABSOLUTE_MAX_AREA_KM2

export interface PolygonTerrainGridInput {
  itemId: string
  itemName: string
  geometry: Polygon | MultiPolygon
  /** Kullanıcı tarafından zorlanmak istenirse zoom override (genelde verilmez) */
  forceZoom?: number
  signal?: AbortSignal
  /** Canvas oluşturulamadığında kullanıcıya gösterilecek hata metni. */
  rasterErrorMessage: string
  /**
   * Polygon içinde kalan her hücre için çağrılır. Hücrenin Horn 3×3 sonucu (slope,
   * aspect, direction) ile birlikte koordinatlarını alır; hücrenin renklendirileceği
   * RGB üçlüsünü döner. Sınıflar/sayaçlar/istatistikler caller closure'unda tutulur.
   */
  onCell: (cell: AspectComputation, x: number, y: number) => [number, number, number]
}

export interface PolygonTerrainGridOutput {
  itemId: string
  itemName: string
  geometry: Polygon | MultiPolygon
  areaKm2: number
  bbox: [number, number, number, number]
  raster: {
    width: number
    height: number
    bbox: [number, number, number, number]
    imageDataUrl: string
  }
  insideCount: number
  tileZoom: number
  resolutionMeters: number
  estimatedTiles: number
}

function createCanvasDataUrl(
  width: number,
  height: number,
  data: Uint8ClampedArray,
  errorMessage: string,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(errorMessage)
  const image = ctx.createImageData(width, height)
  image.data.set(data)
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

function getSampleIndex(x: number, y: number, sampleWidth: number): number {
  return y * sampleWidth + x
}

/**
 * Polygon üzerine Web Mercator DEM (Terrarium) verisinden Horn (1981) tabanlı
 * 3×3 hareketli pencere uygular. Sample noktalarını equirectangular grid'de
 * üretir, tile pixel uzayında bilinear interpolation ile okur ve anisotropic
 * (dx, dy ayrı) cell boyutlarıyla eğim/bakı hesaplar. ArcGIS Pro Spatial Analyst
 * Slope (Planar) yönteminin matematik karşılığı. Caller, onCell callback'i ile
 * hücre başına renklendirme ve istatistik hesabını üstlenir.
 */
export async function analyzePolygonTerrainGrid(
  input: PolygonTerrainGridInput,
): Promise<PolygonTerrainGridOutput> {
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

  // Native DEM çözünürlüğünü aşan oversampling step-function aliasing üretir;
  // raster boyutunu DEM native pixel sayısının MAX_OVERSAMPLE_FACTOR katıyla sınırla.
  const nw = lngLatToGlobalPixel(west, north, tileZoom)
  const se = lngLatToGlobalPixel(east, south, tileZoom)
  const tilePixelsWide = Math.max(2, se.x - nw.x)
  const tilePixelsTall = Math.max(2, se.y - nw.y)
  const maxAllowedWidth = Math.max(MIN_RASTER_DIMENSION, Math.ceil(tilePixelsWide * MAX_OVERSAMPLE_FACTOR))
  const maxAllowedHeight = Math.max(MIN_RASTER_DIMENSION, Math.ceil(tilePixelsTall * MAX_OVERSAMPLE_FACTOR))

  const width = Math.min(
    MAX_RASTER_DIMENSION,
    Math.max(MIN_RASTER_DIMENSION, lod.rasterWidth),
    maxAllowedWidth,
  )
  const height = Math.min(
    MAX_RASTER_DIMENSION,
    Math.max(MIN_RASTER_DIMENSION, lod.rasterHeight),
    maxAllowedHeight,
  )
  const sampleWidth = width + 2
  const sampleHeight = height + 2
  const elevations = new Float32Array(sampleWidth * sampleHeight)

  // Sample noktalarını equirectangular grid'de hesapla (analiz cell merkezleriyle
  // tutarlı), sonra Web Mercator tile pixel uzayına çevirip bilinear oku.
  for (let y = 0; y < sampleHeight; y++) {
    if (input.signal?.aborted) throw new Error('İptal edildi')
    const sampleLat = north - ((y - 1 + 0.5) / height) * (north - south)
    const rowPromises: Promise<void>[] = []
    for (let x = 0; x < sampleWidth; x++) {
      const sampleLng = west + ((x - 1 + 0.5) / width) * (east - west)
      const { x: globalX, y: globalY } = lngLatToGlobalPixel(sampleLng, sampleLat, tileZoom)
      const idx = getSampleIndex(x, y, sampleWidth)
      rowPromises.push(
        readTerrariumElevationAtGlobalPixel(globalX, globalY, tileZoom, input.signal).then((value) => {
          elevations[idx] = value
        }),
      )
    }
    await Promise.all(rowPromises)
  }

  const imageData = new Uint8ClampedArray(width * height * 4)
  const tileResolutionMeters = Math.max(1, groundResolutionMeters(midLat, tileZoom))
  // Equirectangular grid'de dx ve dy farklıdır (yüksek enlemde dx küçülür).
  // Anisotropic Horn kerneli için cell boyutlarını metre cinsinden ayrı hesapla.
  const cosLat = Math.cos(midLat * DEG_TO_RAD)
  const cellSizeXMeters = Math.max(1, ((east - west) / width) * DEG_TO_RAD * EARTH_RADIUS_M * cosLat)
  const cellSizeYMeters = Math.max(1, ((north - south) / height) * DEG_TO_RAD * EARTH_RADIUS_M)
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
      const cell = calculateAspectFromElevationGrid([
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
      ], { x: cellSizeXMeters, y: cellSizeYMeters })

      const [r, g, b] = input.onCell(cell, x, y)
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

  return {
    itemId: input.itemId,
    itemName: input.itemName,
    geometry: input.geometry,
    areaKm2,
    bbox,
    raster: {
      width,
      height,
      bbox,
      imageDataUrl: createCanvasDataUrl(width, height, imageData, input.rasterErrorMessage),
    },
    insideCount,
    tileZoom,
    resolutionMeters: tileResolutionMeters,
    estimatedTiles: lod.estimatedTiles,
  }
}
