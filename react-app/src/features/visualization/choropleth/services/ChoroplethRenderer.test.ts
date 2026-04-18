import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMapMock } from '@/test/maplibreMock'
import { mockPolygonFeature } from '@/test/mockData'
import type { GeoJSONFeatureCollection } from '@/types/geojson'
import type { VisualizationSettings } from '@/types/visualization'

import { ChoroplethRenderer } from './ChoroplethRenderer'

vi.mock('../../shared/labelLayers', () => ({
  applyLabelLayers: vi.fn(),
}))

describe('ChoroplethRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps custom-break outliers with no-data color and hides missing features in data-only mode', async () => {
    const { map, layers, sources } = createMapMock()
    const renderer = new ChoroplethRenderer(map)
    const geojson: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        mockPolygonFeature('Ankara', 0),
        mockPolygonFeature('İzmir', 0),
        mockPolygonFeature('Bursa', 0),
      ],
    }
    const settings: VisualizationSettings = {
      type: 'choropleth',
      classCount: 3,
      classificationMethod: 'custom',
      colorScheme: 'teal',
      customBreaks: [10, 20, 30],
      legendType: 'discrete',
      dataOnlyMode: true,
      dataOnlyStyle: 'hidden',
      noDataColor: '#123456',
    }

    await renderer.render(geojson, [
      { location: 'Ankara', value: 5 },
      { location: 'İzmir', value: 15 },
      { location: 'Bursa', value: 35 },
    ], 'value', settings, 'province')

    const sourceData = sources.get('choropleth-source')?.data as GeoJSON.FeatureCollection
    const fillLayer = layers.get('choropleth-fill')
    const baseExpression = renderer.lastBaseColorExpression as unknown[]
    const fillColor = fillLayer?.paint['fill-color'] as unknown[]

    expect(sourceData.features).toHaveLength(3)
    expect(sourceData.features.map((feature) => feature.properties?.dataValue)).toEqual([5, 15, 35])
    expect(fillLayer?.filter).toEqual(['==', ['get', 'hasData'], true])
    expect(fillColor[0]).toBe('case')
    expect(fillColor[1]).toEqual(['==', ['get', 'hasData'], false])
    expect(fillColor[2]).toBe('#123456')
    expect(baseExpression).toEqual(fillColor[3])
    expect(baseExpression[0]).toBe('case')
    expect(baseExpression[1]).toEqual(['<', ['get', 'dataValue'], 10])
    expect(baseExpression[2]).toBe('#e4e4e4')
    expect(baseExpression[3]).toEqual(['>', ['get', 'dataValue'], 30])
    expect(baseExpression[4]).toBe('#e4e4e4')
  })

  it('uses transparent no-data opacity without dropping features from the layer filter', async () => {
    const { map, layers, sources } = createMapMock()
    const renderer = new ChoroplethRenderer(map)
    const geojson: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        mockPolygonFeature('Ankara', 0),
        mockPolygonFeature('İzmir', 0),
      ],
    }
    const settings: VisualizationSettings = {
      type: 'choropleth',
      classCount: 5,
      classificationMethod: 'equal',
      colorScheme: 'teal',
      legendType: 'discrete',
      dataOnlyMode: true,
      dataOnlyStyle: 'transparent',
      choroplethOpacity: 0.4,
    }

    await renderer.render(geojson, [
      { location: 'Ankara', value: 10 },
    ], 'value', settings, 'province')

    const sourceData = sources.get('choropleth-source')?.data as GeoJSON.FeatureCollection
    const fillLayer = layers.get('choropleth-fill')

    expect(sourceData.features.map((feature) => feature.properties?.hasData)).toEqual([true, false])
    expect(fillLayer?.filter).toEqual(['any', ['==', ['get', 'hasData'], true], ['==', ['get', 'hasData'], false]])
    expect(fillLayer?.paint['fill-opacity']).toEqual(['case', ['==', ['get', 'hasData'], false], 0, 0.4])
  })
})
