import type { TerrainAnalysisPoint, TerrainAnalysisResult } from '../types'
import {
  calculateAspectFromElevationGrid,
  clampTerrainZoom,
  decodeTerrariumElevation,
  DEFAULT_TERRAIN_ZOOM,
  getOffsetTilePixel,
  groundResolutionMeters,
  terrariumTileUrl,
  TERRAIN_TILE_SIZE,
} from './terrainMath'

interface TerrariumTile {
  imageData: ImageData
}

interface AnalyzeOptions {
  zoom?: number
  signal?: AbortSignal
}

const tileCache = new Map<string, Promise<TerrariumTile>>()

function getTileCacheKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`
}

async function blobToImageData(blob: Blob): Promise<ImageData> {
  let bitmap: ImageBitmap | null = null
  if ('createImageBitmap' in window) {
    bitmap = await createImageBitmap(blob)
  } else {
    const objectUrl = URL.createObjectURL(blob)
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('DEM tile görüntüsü okunamadı'))
        img.src = objectUrl
      })
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas bağlamı oluşturulamadı')
      ctx.drawImage(image, 0, 0)
      return { imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) }.imageData
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas bağlamı oluşturulamadı')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

async function fetchTerrariumTile(z: number, x: number, y: number, signal?: AbortSignal): Promise<TerrariumTile> {
  const key = getTileCacheKey(z, x, y)
  const existing = tileCache.get(key)
  if (existing) return existing

  const promise = fetch(terrariumTileUrl({ z, x, y }), { signal })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`DEM tile alınamadı (${response.status})`)
      }
      const blob = await response.blob()
      const imageData = await blobToImageData(blob)
      return { imageData }
    })
    .catch((error) => {
      tileCache.delete(key)
      throw error
    })

  tileCache.set(key, promise)
  return promise
}

async function readElevationAtOffset(
  point: TerrainAnalysisPoint,
  zoom: number,
  offsetX: number,
  offsetY: number,
  signal?: AbortSignal,
): Promise<number> {
  const tilePixel = getOffsetTilePixel(point.lng, point.lat, zoom, offsetX, offsetY)
  const tile = await fetchTerrariumTile(tilePixel.z, tilePixel.x, tilePixel.y, signal)
  const image = tile.imageData
  const x = Math.min(image.width - 1, Math.max(0, tilePixel.pixelX))
  const y = Math.min(image.height - 1, Math.max(0, tilePixel.pixelY))
  const idx = (y * image.width + x) * 4
  return decodeTerrariumElevation(
    image.data[idx],
    image.data[idx + 1],
    image.data[idx + 2],
  )
}

export async function analyzeAspectFromTerrarium(
  point: TerrainAnalysisPoint,
  options: AnalyzeOptions = {},
): Promise<TerrainAnalysisResult> {
  const tileZoom = clampTerrainZoom(options.zoom ?? DEFAULT_TERRAIN_ZOOM)
  const offsets = [-1, 0, 1] as const
  const rows = await Promise.all(offsets.map(async (offsetY) => (
    Promise.all(offsets.map((offsetX) => (
      readElevationAtOffset(point, tileZoom, offsetX, offsetY, options.signal)
    )))
  ))) as [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ]

  for (const row of rows) {
    for (const value of row) {
      if (!isFinite(value)) throw new Error('Geçersiz DEM değeri alındı')
    }
  }

  const cellSize = Math.max(1, groundResolutionMeters(point.lat, tileZoom))
  const aspect = calculateAspectFromElevationGrid(rows, cellSize)
  const elevation = rows[1][1]

  return {
    point,
    elevation: Math.round(elevation * 10) / 10,
    slopeDegrees: Math.round(aspect.slopeDegrees * 10) / 10,
    slopePercent: Math.round(aspect.slopePercent * 10) / 10,
    aspectDegrees: aspect.aspectDegrees === null ? null : Math.round(aspect.aspectDegrees),
    direction: aspect.direction,
    directionLabel: aspect.directionLabel,
    tileZoom,
    source: 'aws-terrarium',
  }
}

export function clearTerrariumTileCache(): void {
  tileCache.clear()
}

export { TERRAIN_TILE_SIZE }
