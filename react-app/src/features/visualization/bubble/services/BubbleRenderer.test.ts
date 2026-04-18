import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMapMock } from '@/test/maplibreMock'
import { mockPolygonFeature } from '@/test/mockData'
import type { GeoJSONFeatureCollection } from '@/types/geojson'
import type { VisualizationSettings } from '@/types/visualization'

import { BubbleRenderer } from './BubbleRenderer'

vi.mock('../../shared/labelLayers', () => ({
  applyLabelLayers: vi.fn(),
}))

describe('BubbleRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters out custom-break outliers before creating bubble features and keeps larger radii underneath', async () => {
    const { map, sources } = createMapMock()
    const renderer = new BubbleRenderer(map)
    const geojson: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        mockPolygonFeature('Ankara', 0),
        mockPolygonFeature('İzmir', 0),
        mockPolygonFeature('Bursa', 0),
      ],
    }
    const settings: VisualizationSettings = {
      type: 'bubble',
      classCount: 3,
      classificationMethod: 'custom',
      colorScheme: 'teal',
      customBreaks: [10, 20, 30],
      legendType: 'discrete',
    }

    await renderer.render(geojson, [
      { location: 'Ankara', value: 15 },
      { location: 'İzmir', value: 25 },
      { location: 'Bursa', value: 35 },
    ], 'value', settings, 'province')

    const bubbleSource = sources.get('bubble-source')?.data as GeoJSON.FeatureCollection

    expect(bubbleSource.features).toHaveLength(2)
    expect(bubbleSource.features.map((feature) => feature.properties?.dataValue)).toEqual([25, 15])
  })

  it('derives bivariate in-range flags from the color column and keeps labels in sync', async () => {
    const { map, layers, sources } = createMapMock()
    const renderer = new BubbleRenderer(map)
    const geojson: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        mockPolygonFeature('Ankara', 0),
        mockPolygonFeature('İzmir', 0),
      ],
    }
    const settings: VisualizationSettings = {
      type: 'bubble',
      classCount: 5,
      classificationMethod: 'jenks',
      colorScheme: 'teal',
      colorColumn: 'color_metric',
      legendType: 'discrete',
      customRange: {
        enabled: true,
        min: 10,
        center: null,
        max: 20,
        outOfRangeMode: 'transparent',
      },
    }

    await renderer.render(geojson, [
      { location: 'Ankara', value: 100, color_metric: 5 },
      { location: 'İzmir', value: 50, color_metric: 15 },
    ], 'value', settings, 'province')

    const bubbleSource = sources.get('bubble-source')?.data as GeoJSON.FeatureCollection
    const labelSource = sources.get('viz-label-source')?.data as GeoJSON.FeatureCollection
    const bubbleLayer = layers.get('bubble-circles')

    expect(bubbleLayer?.filter).toEqual(['all', ['==', ['get', 'hasData'], true], ['==', ['get', 'inCustomRange'], true]])
    expect(bubbleSource.features.map((feature) => ({
      name: feature.properties?.displayName,
      colorValue: feature.properties?.colorValue,
      inCustomRange: feature.properties?.inCustomRange,
    }))).toEqual([
      { name: 'Ankara', colorValue: 5, inCustomRange: false },
      { name: 'İzmir', colorValue: 15, inCustomRange: true },
    ])
    expect(labelSource.features.map((feature) => ({
      name: feature.properties?.displayName,
      inCustomRange: feature.properties?.inCustomRange,
    }))).toEqual([
      { name: 'Ankara', inCustomRange: false },
      { name: 'İzmir', inCustomRange: true },
    ])
  })
})
