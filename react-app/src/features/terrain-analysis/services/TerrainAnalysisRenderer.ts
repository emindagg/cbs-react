import type { FeatureCollection, LineString, Point } from 'geojson'
import type { GeoJSONSource, ImageSource, Map as MapLibreMap } from 'maplibre-gl'

import type { TerrainAnalysisResult, TerrainSlopeResult } from '../types'

const POINT_SOURCE_ID = 'terrain-aspect-point-source'
const ARROW_SOURCE_ID = 'terrain-aspect-arrow-source'
const ARROW_HEAD_SOURCE_ID = 'terrain-aspect-arrow-head-source'

const ARROW_LAYER_ID = 'terrain-aspect-arrow-line'
const ARROW_HEAD_LAYER_ID = 'terrain-aspect-arrow-head'
const POINT_LAYER_ID = 'terrain-aspect-point'
const LABEL_LAYER_ID = 'terrain-aspect-label'
const SLOPE_RASTER_SOURCE_ID = 'terrain-slope-raster-source'
const SLOPE_RASTER_LAYER_ID = 'terrain-slope-raster-layer'
const SLOPE_BOUNDARY_SOURCE_ID = 'terrain-slope-boundary-source'
const SLOPE_BOUNDARY_LAYER_ID = 'terrain-slope-boundary-layer'

const EMPTY_POINTS: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] }
const EMPTY_LINES: FeatureCollection<LineString> = { type: 'FeatureCollection', features: [] }
// Eğim şiddetine göre dinamik ok uzunluğu:
//  düz arazi  ≈ MIN, %100 eğim (≈45°) ≈ MAX
const ARROW_MIN_LENGTH_METERS = 200
const ARROW_MAX_LENGTH_METERS = 900
// Slope yüzde değerini 0-1 arasına normalize etmek için doyum noktası (%100 = doyum)
const ARROW_SLOPE_SATURATION_PERCENT = 100
const EARTH_RADIUS_METERS = 6371008.8
const LABEL_OFFSET_Y = 1.4

function arrowLengthForSlope(slopePercent: number): number {
  const t = Math.max(0, Math.min(1, slopePercent / ARROW_SLOPE_SATURATION_PERCENT))
  return ARROW_MIN_LENGTH_METERS + (ARROW_MAX_LENGTH_METERS - ARROW_MIN_LENGTH_METERS) * t
}

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
  const arrowLength = arrowLengthForSlope(result.slopePercent)
  const end = destinationPoint(result.point.lng, result.point.lat, result.aspectDegrees, arrowLength)
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

  setSlopeOpacity(opacity: number): void {
    if (this.map.getLayer(SLOPE_RASTER_LAYER_ID)) {
      this.map.setPaintProperty(SLOPE_RASTER_LAYER_ID, 'raster-opacity', Math.max(0, Math.min(1, opacity)))
    }
  }

  renderSlope(result: TerrainSlopeResult | null, opacity = 0.92): void {
    if (!result) {
      this.removeSlope()
      return
    }

    const [w, s, e, n] = result.raster.bbox
    const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
      [w, n],
      [e, n],
      [e, s],
      [w, s],
    ]
    const rasterSource = this.map.getSource(SLOPE_RASTER_SOURCE_ID) as ImageSource | undefined
    if (rasterSource) {
      rasterSource.updateImage({ url: result.raster.imageDataUrl, coordinates })
    } else {
      this.map.addSource(SLOPE_RASTER_SOURCE_ID, {
        type: 'image',
        url: result.raster.imageDataUrl,
        coordinates,
      })
    }

    const boundaryData: FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: result.geometry,
        properties: { name: result.itemName },
      }],
    }
    ensureSource(this.map, SLOPE_BOUNDARY_SOURCE_ID, boundaryData)

    if (!this.map.getLayer(SLOPE_RASTER_LAYER_ID)) {
      this.map.addLayer({
        id: SLOPE_RASTER_LAYER_ID,
        type: 'raster',
        source: SLOPE_RASTER_SOURCE_ID,
        paint: {
          'raster-opacity': Math.max(0, Math.min(1, opacity)),
          'raster-resampling': 'linear',
          'raster-fade-duration': 0,
        },
      })
    } else {
      this.setSlopeOpacity(opacity)
    }

    if (!this.map.getLayer(SLOPE_BOUNDARY_LAYER_ID)) {
      this.map.addLayer({
        id: SLOPE_BOUNDARY_LAYER_ID,
        type: 'line',
        source: SLOPE_BOUNDARY_SOURCE_ID,
        paint: {
          'line-color': '#ff0000',
          'line-width': 2.5,
          'line-opacity': 0.95,
        },
      })
    }

    for (const layerId of [SLOPE_RASTER_LAYER_ID, SLOPE_BOUNDARY_LAYER_ID]) {
      if (this.map.getLayer(layerId)) this.map.moveLayer(layerId)
    }
  }

  remove(): void {
    removeLayer(this.map, LABEL_LAYER_ID)
    removeLayer(this.map, POINT_LAYER_ID)
    removeLayer(this.map, ARROW_HEAD_LAYER_ID)
    removeLayer(this.map, ARROW_LAYER_ID)
    removeSource(this.map, POINT_SOURCE_ID)
    removeSource(this.map, ARROW_HEAD_SOURCE_ID)
    removeSource(this.map, ARROW_SOURCE_ID)
    this.removeSlope()
  }

  removeAspect(): void {
    removeLayer(this.map, LABEL_LAYER_ID)
    removeLayer(this.map, POINT_LAYER_ID)
    removeLayer(this.map, ARROW_HEAD_LAYER_ID)
    removeLayer(this.map, ARROW_LAYER_ID)
    removeSource(this.map, POINT_SOURCE_ID)
    removeSource(this.map, ARROW_HEAD_SOURCE_ID)
    removeSource(this.map, ARROW_SOURCE_ID)
  }

  removeSlope(): void {
    removeLayer(this.map, SLOPE_BOUNDARY_LAYER_ID)
    removeLayer(this.map, SLOPE_RASTER_LAYER_ID)
    removeSource(this.map, SLOPE_BOUNDARY_SOURCE_ID)
    removeSource(this.map, SLOPE_RASTER_SOURCE_ID)
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
