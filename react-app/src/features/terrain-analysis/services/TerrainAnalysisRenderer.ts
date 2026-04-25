import type { FeatureCollection, LineString, Point } from 'geojson'
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'

import type { TerrainAnalysisResult } from '../types'

const POINT_SOURCE_ID = 'terrain-aspect-point-source'
const ARROW_SOURCE_ID = 'terrain-aspect-arrow-source'
const ARROW_HEAD_SOURCE_ID = 'terrain-aspect-arrow-head-source'

const ARROW_LAYER_ID = 'terrain-aspect-arrow-line'
const ARROW_HEAD_LAYER_ID = 'terrain-aspect-arrow-head'
const POINT_LAYER_ID = 'terrain-aspect-point'
const LABEL_LAYER_ID = 'terrain-aspect-label'

const EMPTY_POINTS: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] }
const EMPTY_LINES: FeatureCollection<LineString> = { type: 'FeatureCollection', features: [] }
const ARROW_LENGTH_METERS = 450
const EARTH_RADIUS_METERS = 6371008.8
const LABEL_OFFSET_Y = 1.4

function ensureSource(map: MapLibreMap, id: string, data: FeatureCollection): void {
  const source = map.getSource(id) as GeoJSONSource | undefined
  if (source) {
    source.setData(data)
  } else {
    map.addSource(id, { type: 'geojson', data })
  }
}

function removeLayer(map: MapLibreMap, id: string): void {
  if (map.getLayer(id)) map.removeLayer(id)
}

function removeSource(map: MapLibreMap, id: string): void {
  if (map.getSource(id)) map.removeSource(id)
}

function destinationPoint(lng: number, lat: number, bearingDegrees: number, distanceMeters: number): [number, number] {
  const bearing = (bearingDegrees * Math.PI) / 180
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS
  const lat1 = (lat * Math.PI) / 180
  const lng1 = (lng * Math.PI) / 180

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  )
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
  )

  return [(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]
}

function createPointData(result: TerrainAnalysisResult): FeatureCollection<Point> {
  const degreeLabel = result.aspectDegrees === null ? 'Düz' : `${result.aspectDegrees}°`
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [result.point.lng, result.point.lat] },
      properties: {
        label: `${result.directionLabel} ${degreeLabel}`,
      },
    }],
  }
}

function createArrowData(result: TerrainAnalysisResult): {
  line: FeatureCollection<LineString>
  head: FeatureCollection<Point>
} {
  if (result.aspectDegrees === null) {
    return { line: EMPTY_LINES, head: EMPTY_POINTS }
  }

  const start: [number, number] = [result.point.lng, result.point.lat]
  const end = destinationPoint(result.point.lng, result.point.lat, result.aspectDegrees, ARROW_LENGTH_METERS)
  return {
    line: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [start, end] },
        properties: {},
      }],
    },
    head: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: end },
        properties: { bearing: result.aspectDegrees },
      }],
    },
  }
}

export class TerrainAnalysisRenderer {
  private map: MapLibreMap

  constructor(map: MapLibreMap) {
    this.map = map
  }

  render(result: TerrainAnalysisResult | null): void {
    if (!result) {
      this.remove()
      return
    }

    const pointData = createPointData(result)
    const arrowData = createArrowData(result)

    ensureSource(this.map, ARROW_SOURCE_ID, arrowData.line)
    ensureSource(this.map, ARROW_HEAD_SOURCE_ID, arrowData.head)
    ensureSource(this.map, POINT_SOURCE_ID, pointData)
    this.ensureLayers()
    this.bringToFront()
  }

  remove(): void {
    removeLayer(this.map, LABEL_LAYER_ID)
    removeLayer(this.map, POINT_LAYER_ID)
    removeLayer(this.map, ARROW_HEAD_LAYER_ID)
    removeLayer(this.map, ARROW_LAYER_ID)
    removeSource(this.map, POINT_SOURCE_ID)
    removeSource(this.map, ARROW_HEAD_SOURCE_ID)
    removeSource(this.map, ARROW_SOURCE_ID)
  }

  private ensureLayers(): void {
    if (!this.map.getLayer(ARROW_LAYER_ID)) {
      this.map.addLayer({
        id: ARROW_LAYER_ID,
        type: 'line',
        source: ARROW_SOURCE_ID,
        paint: {
          'line-color': '#0f766e',
          'line-width': 4,
          'line-opacity': 0.88,
        },
      })
    }

    if (!this.map.getLayer(ARROW_HEAD_LAYER_ID)) {
      this.map.addLayer({
        id: ARROW_HEAD_LAYER_ID,
        type: 'symbol',
        source: ARROW_HEAD_SOURCE_ID,
        layout: {
          'text-field': '▲',
          'text-size': 18,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-rotate': ['get', 'bearing'] as never,
        },
        paint: {
          'text-color': '#0f766e',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      })
    }

    if (!this.map.getLayer(POINT_LAYER_ID)) {
      this.map.addLayer({
        id: POINT_LAYER_ID,
        type: 'circle',
        source: POINT_SOURCE_ID,
        paint: {
          'circle-radius': 7,
          'circle-color': '#14b8a6',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.95,
        },
      })
    }

    if (!this.map.getLayer(LABEL_LAYER_ID)) {
      this.map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: POINT_SOURCE_ID,
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
          'text-offset': [0, LABEL_OFFSET_Y],
          'text-anchor': 'top',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.4,
        },
      })
    }
  }

  private bringToFront(): void {
    for (const layerId of [ARROW_LAYER_ID, ARROW_HEAD_LAYER_ID, POINT_LAYER_ID, LABEL_LAYER_ID]) {
      if (this.map.getLayer(layerId)) this.map.moveLayer(layerId)
    }
  }
}
