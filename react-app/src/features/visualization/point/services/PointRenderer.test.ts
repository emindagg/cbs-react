import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMapMock } from '@/test/maplibreMock'
import { mockPolygonFeature } from '@/test/mockData'
import type { GeoJSONFeatureCollection } from '@/types/geojson'
import type { VisualizationSettings } from '@/types/visualization'

import { PointRenderer } from './PointRenderer'

vi.mock('../../shared/labelLayers', () => ({
  applyLabelLayers: vi.fn(),
}))

describe('PointRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates deterministic dot counts from the configured dot value and skips zero-valued features', async () => {
    const { map, sources } = createMapMock()
    const renderer = new PointRenderer(map)
    const geojson: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        mockPolygonFeature('Ankara', 0),
        mockPolygonFeature('İzmir', 0),
        mockPolygonFeature('Bursa', 0),
      ],
    }
    const settings: VisualizationSettings = {
      type: 'dot',
      classCount: 5,
      classificationMethod: 'jenks',
      colorScheme: 'teal',
      legendType: 'discrete',
      dotValue: 10,
    }

    await renderer.render(geojson, [
      { location: 'Ankara', value: 10 },
      { location: 'İzmir', value: 20 },
      { location: 'Bursa', value: 0 },
    ], 'value', settings, 'province')

    const dotSource = sources.get('dot-source')?.data as GeoJSON.FeatureCollection

    expect(dotSource.features).toHaveLength(3)
    expect(dotSource.features.map((feature) => feature.properties?.displayName)).toEqual(['Ankara', 'İzmir', 'İzmir'])
  })

  it('uses transparent custom-range filtering for dots and applies data-only backdrop opacity', async () => {
    const { map, layers, sources } = createMapMock()
    const renderer = new PointRenderer(map)
    const geojson: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        mockPolygonFeature('Ankara', 0),
        mockPolygonFeature('İzmir', 0),
      ],
    }
    const settings: VisualizationSettings = {
      type: 'dot',
      classCount: 5,
      classificationMethod: 'jenks',
      colorScheme: 'teal',
      legendType: 'discrete',
      dotValue: 10,
      dataOnlyMode: true,
      backdropFillOpacity: 0.4,
      noDataColor: '#abcdef',
      customRange: {
        enabled: true,
        min: 15,
        center: null,
        max: 25,
        outOfRangeMode: 'transparent',
      },
    }

    await renderer.render(geojson, [
      { location: 'Ankara', value: 10 },
      { location: 'İzmir', value: 20 },
    ], 'value', settings, 'province')

    const dotLayer = layers.get('dot-circles')
    const backdropFillLayer = layers.get('viz-backdrop-fill')
    const labelSource = sources.get('viz-label-source')?.data as GeoJSON.FeatureCollection

    expect(dotLayer?.filter).toEqual(['all', ['==', ['get', 'hasData'], true], ['==', ['get', 'inCustomRange'], true]])
    expect(backdropFillLayer?.paint['fill-color']).toBe('#abcdef')
    expect(backdropFillLayer?.paint['fill-opacity']).toEqual(['case', ['==', ['get', 'hasData'], true], 0.4, 0])
    expect(labelSource.features.map((feature) => ({
      name: feature.properties?.displayName,
      inCustomRange: feature.properties?.inCustomRange,
    }))).toEqual([
      { name: 'Ankara', inCustomRange: false },
      { name: 'İzmir', inCustomRange: true },
    ])
  })
})
