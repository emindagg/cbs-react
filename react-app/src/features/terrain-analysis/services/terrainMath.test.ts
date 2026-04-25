import { describe, expect, it } from 'vitest'

import {
  calculateAspectFromElevationGrid,
  classifyAspectDirection,
  clampTerrainZoom,
  decodeTerrariumElevation,
  lngLatToTilePixel,
  normalizeDegrees,
} from './terrainMath'

describe('terrainMath', () => {
  it('decodes Terrarium RGB elevation values', () => {
    expect(decodeTerrariumElevation(128, 0, 0)).toBe(0)
    expect(decodeTerrariumElevation(128, 10, 0)).toBe(10)
    expect(decodeTerrariumElevation(127, 255, 0)).toBe(-1)
  })

  it('normalizes degrees into a 0-360 range', () => {
    expect(normalizeDegrees(-90)).toBe(270)
    expect(normalizeDegrees(450)).toBe(90)
  })

  it('classifies aspect directions with Turkish labels', () => {
    expect(classifyAspectDirection(null)).toEqual({ direction: 'flat', directionLabel: 'Düz' })
    expect(classifyAspectDirection(0).directionLabel).toBe('Kuzey')
    expect(classifyAspectDirection(45).directionLabel).toBe('Kuzeydoğu')
    expect(classifyAspectDirection(90).directionLabel).toBe('Doğu')
    expect(classifyAspectDirection(180).directionLabel).toBe('Güney')
    expect(classifyAspectDirection(225).directionLabel).toBe('Güneybatı')
    expect(classifyAspectDirection(270).directionLabel).toBe('Batı')
  })

  it('calculates south-facing aspect when elevation rises northward', () => {
    const result = calculateAspectFromElevationGrid([
      [120, 120, 120],
      [100, 100, 100],
      [80, 80, 80],
    ], 10)

    expect(result.directionLabel).toBe('Güney')
    expect(result.aspectDegrees).toBeCloseTo(180, 5)
    expect(result.slopeDegrees).toBeGreaterThan(0)
  })

  it('calculates west-facing aspect when elevation rises eastward', () => {
    const result = calculateAspectFromElevationGrid([
      [80, 100, 120],
      [80, 100, 120],
      [80, 100, 120],
    ], 10)

    expect(result.directionLabel).toBe('Batı')
    expect(result.aspectDegrees).toBeCloseTo(270, 5)
  })

  it('returns flat direction for a level 3x3 grid', () => {
    const result = calculateAspectFromElevationGrid([
      [100, 100, 100],
      [100, 100, 100],
      [100, 100, 100],
    ], 10)

    expect(result.aspectDegrees).toBeNull()
    expect(result.directionLabel).toBe('Düz')
  })

  it('clamps DEM zoom to supported range', () => {
    expect(clampTerrainZoom(2)).toBe(12)
    expect(clampTerrainZoom(14.4)).toBe(14)
    expect(clampTerrainZoom(20)).toBe(15)
  })

  it('converts lng/lat into valid tile pixel coordinates', () => {
    const tile = lngLatToTilePixel(35.2433, 38.9637, 14)
    expect(tile.z).toBe(14)
    expect(tile.x).toBeGreaterThanOrEqual(0)
    expect(tile.y).toBeGreaterThanOrEqual(0)
    expect(tile.pixelX).toBeGreaterThanOrEqual(0)
    expect(tile.pixelX).toBeLessThan(256)
    expect(tile.pixelY).toBeGreaterThanOrEqual(0)
    expect(tile.pixelY).toBeLessThan(256)
  })
})
