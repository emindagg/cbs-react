import type { AspectDirection } from '../types'

export const TERRAIN_TILE_SIZE = 256
export const DEFAULT_TERRAIN_ZOOM = 14
export const MIN_TERRAIN_ZOOM = 12
export const MAX_TERRAIN_ZOOM = 15

const MAX_MERCATOR_LAT = 85.05112878
const WEB_MERCATOR_INITIAL_RESOLUTION = 156543.03392804097
const TERRARIUM_ELEVATION_OFFSET = 32768
const BYTE_RANGE = 256
const HALF_SECTOR = 22.5
const FLAT_SLOPE_THRESHOLD_DEGREES = 0.1
const WEST_DEGREES = 270
const HORN_KERNEL_DIVISOR = 8

export interface TilePixel {
  z: number
  x: number
  y: number
  pixelX: number
  pixelY: number
}

export interface AspectComputation {
  slopeDegrees: number
  slopePercent: number
  aspectDegrees: number | null
  direction: AspectDirection
  directionLabel: string
}

export function clampTerrainZoom(zoom: number): number {
  if (!isFinite(zoom)) return DEFAULT_TERRAIN_ZOOM
  return Math.max(MIN_TERRAIN_ZOOM, Math.min(MAX_TERRAIN_ZOOM, Math.round(zoom)))
}

export function clampWebMercatorLatitude(lat: number): number {
  return Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat))
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360
}

export function groundResolutionMeters(latitude: number, zoom: number): number {
  const latRad = (clampWebMercatorLatitude(latitude) * Math.PI) / 180
  return (WEB_MERCATOR_INITIAL_RESOLUTION * Math.cos(latRad)) / (2 ** zoom)
}

export function lngLatToGlobalPixel(lng: number, lat: number, zoom: number): { x: number; y: number } {
  const clampedLat = clampWebMercatorLatitude(lat)
  const sinLat = Math.sin((clampedLat * Math.PI) / 180)
  const scale = TERRAIN_TILE_SIZE * (2 ** zoom)
  const x = ((lng + 180) / 360) * scale
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  return { x, y }
}

export function globalPixelToTilePixel(globalX: number, globalY: number, zoom: number): TilePixel {
  const tileCount = 2 ** zoom
  const maxGlobalPixel = tileCount * TERRAIN_TILE_SIZE - 1
  const wrappedX = ((Math.floor(globalX) % (tileCount * TERRAIN_TILE_SIZE)) + (tileCount * TERRAIN_TILE_SIZE)) % (tileCount * TERRAIN_TILE_SIZE)
  const clampedY = Math.max(0, Math.min(maxGlobalPixel, Math.floor(globalY)))
  const x = Math.floor(wrappedX / TERRAIN_TILE_SIZE)
  const y = Math.floor(clampedY / TERRAIN_TILE_SIZE)
  return {
    z: zoom,
    x,
    y,
    pixelX: wrappedX - x * TERRAIN_TILE_SIZE,
    pixelY: clampedY - y * TERRAIN_TILE_SIZE,
  }
}

export function lngLatToTilePixel(lng: number, lat: number, zoom: number): TilePixel {
  const global = lngLatToGlobalPixel(lng, lat, zoom)
  return globalPixelToTilePixel(global.x, global.y, zoom)
}

export function getOffsetTilePixel(lng: number, lat: number, zoom: number, offsetX: number, offsetY: number): TilePixel {
  const global = lngLatToGlobalPixel(lng, lat, zoom)
  return globalPixelToTilePixel(Math.round(global.x) + offsetX, Math.round(global.y) + offsetY, zoom)
}

export function terrariumTileUrl(tile: Pick<TilePixel, 'z' | 'x' | 'y'>): string {
  return `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${tile.z}/${tile.x}/${tile.y}.png`
}

export function decodeTerrariumElevation(red: number, green: number, blue: number): number {
  return red * BYTE_RANGE + green + blue / BYTE_RANGE - TERRARIUM_ELEVATION_OFFSET
}

export function classifyAspectDirection(aspectDegrees: number | null): {
  direction: AspectDirection
  directionLabel: string
} {
  if (aspectDegrees === null) return { direction: 'flat', directionLabel: 'Düz' }

  const degree = normalizeDegrees(aspectDegrees)
  if (degree >= 360 - HALF_SECTOR || degree < HALF_SECTOR) {
    return { direction: 'north', directionLabel: 'Kuzey' }
  }
  if (degree < 90 - HALF_SECTOR) return { direction: 'northeast', directionLabel: 'Kuzeydoğu' }
  if (degree < 90 + HALF_SECTOR) return { direction: 'east', directionLabel: 'Doğu' }
  if (degree < 180 - HALF_SECTOR) return { direction: 'southeast', directionLabel: 'Güneydoğu' }
  if (degree < 180 + HALF_SECTOR) return { direction: 'south', directionLabel: 'Güney' }
  if (degree < WEST_DEGREES - HALF_SECTOR) return { direction: 'southwest', directionLabel: 'Güneybatı' }
  if (degree < WEST_DEGREES + HALF_SECTOR) return { direction: 'west', directionLabel: 'Batı' }
  return { direction: 'northwest', directionLabel: 'Kuzeybatı' }
}

export function calculateAspectFromElevationGrid(
  grid: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ],
  cellSizeMeters: number,
): AspectComputation {
  const safeCellSize = Math.max(1, cellSizeMeters)
  const z1 = grid[0][0]
  const z2 = grid[0][1]
  const z3 = grid[0][2]
  const z4 = grid[1][0]
  const z6 = grid[1][2]
  const z7 = grid[2][0]
  const z8 = grid[2][1]
  const z9 = grid[2][2]

  const dzdx = ((z3 + 2 * z6 + z9) - (z1 + 2 * z4 + z7)) / (HORN_KERNEL_DIVISOR * safeCellSize)
  const dzdyNorth = ((z1 + 2 * z2 + z3) - (z7 + 2 * z8 + z9)) / (HORN_KERNEL_DIVISOR * safeCellSize)
  const gradient = Math.sqrt(dzdx * dzdx + dzdyNorth * dzdyNorth)
  const slopeDegrees = (Math.atan(gradient) * 180) / Math.PI
  const slopePercent = gradient * 100
  const aspectDegrees = slopeDegrees < FLAT_SLOPE_THRESHOLD_DEGREES
    ? null
    : normalizeDegrees((Math.atan2(-dzdx, -dzdyNorth) * 180) / Math.PI)

  return {
    slopeDegrees,
    slopePercent,
    aspectDegrees,
    ...classifyAspectDirection(aspectDegrees),
  }
}
