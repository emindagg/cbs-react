import { describe, expect, it } from 'vitest'

import { createMapMock } from '@/test/maplibreMock'

import { TerrainAnalysisRenderer } from './TerrainAnalysisRenderer'
import type { TerrainAnalysisResult } from '../types'

function createResult(overrides: Partial<TerrainAnalysisResult> = {}): TerrainAnalysisResult {
  return {
    point: { lng: 35.2433, lat: 38.9637 },
    elevation: 1200,
    slopeDegrees: 12.5,
    slopePercent: 22.1,
    aspectDegrees: 225,
    direction: 'southwest',
    directionLabel: 'Güneybatı',
    tileZoom: 14,
    source: 'aws-terrarium',
    ...overrides,
  }
}

describe('TerrainAnalysisRenderer', () => {
  it('adds point, arrow and label layers for an aspect result', () => {
    const { map, layers, sources } = createMapMock()
    const renderer = new TerrainAnalysisRenderer(map)

    renderer.render(createResult())

    expect(sources.has('terrain-aspect-point-source')).toBe(true)
    expect(sources.has('terrain-aspect-arrow-source')).toBe(true)
    expect(sources.has('terrain-aspect-arrow-head-source')).toBe(true)
    expect(layers.has('terrain-aspect-point')).toBe(true)
    expect(layers.has('terrain-aspect-arrow-line')).toBe(true)
    expect(layers.has('terrain-aspect-arrow-head')).toBe(true)
    expect(layers.has('terrain-aspect-label')).toBe(true)
  })

  it('does not draw an arrow for flat terrain', () => {
    const { map, sources } = createMapMock()
    const renderer = new TerrainAnalysisRenderer(map)

    renderer.render(createResult({
      aspectDegrees: null,
      direction: 'flat',
      directionLabel: 'Düz',
    }))

    const arrowSource = sources.get('terrain-aspect-arrow-source')
    const arrowData = arrowSource?.data as GeoJSON.FeatureCollection
    expect(arrowData.features).toHaveLength(0)
  })

  it('removes all terrain analysis layers and sources', () => {
    const { map, layers, sources } = createMapMock()
    const renderer = new TerrainAnalysisRenderer(map)

    renderer.render(createResult())
    renderer.remove()

    expect(layers.size).toBe(0)
    expect(sources.size).toBe(0)
  })

  it('adds raster and boundary layers for slope result', () => {
    const { map, layers, sources } = createMapMock()
    const renderer = new TerrainAnalysisRenderer(map)

    renderer.renderSlope({
      itemId: 'poly-1',
      itemName: 'Test Alanı',
      geometry: {
        type: 'Polygon',
        coordinates: [[[35, 39], [35.01, 39], [35.01, 39.01], [35, 39.01], [35, 39]]],
      },
      areaKm2: 1,
      raster: {
        width: 2,
        height: 2,
        bbox: [35, 39, 35.01, 39.01],
        imageDataUrl: 'data:image/png;base64,test',
      },
      classes: [],
      minSlopePercent: 0,
      maxSlopePercent: 45,
      avgSlopePercent: 20,
      tileZoom: 14,
      source: 'aws-terrarium',
    })

    expect(sources.has('terrain-slope-raster-source')).toBe(true)
    expect(sources.has('terrain-slope-boundary-source')).toBe(true)
    expect(layers.has('terrain-slope-raster-layer')).toBe(true)
    expect(layers.has('terrain-slope-boundary-layer')).toBe(true)
  })
})
