import * as turf from '@turf/turf'
import type { Geometry } from 'geojson'
import type { Map, GeoJSONSource } from 'maplibre-gl'

import type { NearestPointsConfig, SpatialLayerStyle } from '../types'
import {
  bboxGapDistanceKm,
  computeNearestGeometryConnection,
  prepareNearestGeometries,
} from './nearestGeometry'

const LINE_SOURCE_ID = 'nearest-points-line-source'
const LINE_LAYER_ID = 'nearest-points-line'
const SHORTEST_SOURCE_ID = 'nearest-shortest-source'
const SHORTEST_LAYER_ID = 'nearest-shortest-line'
const LABEL_SOURCE_ID = 'nearest-label-source'
const LABEL_LAYER_ID = 'nearest-label'

export interface NearestPairResult {
  totalPairs: number
  shortestDistance: number
  averageDistance: number
}

export class NearestPointsRenderer {
  private map: Map

  constructor(map: Map) {
    this.map = map
  }

  render(
    geometries: GeoJSON.FeatureCollection<Geometry>,
    style: SpatialLayerStyle,
    config: NearestPointsConfig,
  ): NearestPairResult | null {
    if (geometries.features.length < 2) return null

    const { lines, shortest, labels, stats } = this.computeNearestPairs(geometries)

    if (config.showAllLines) {
      this.addOrUpdateSource(LINE_SOURCE_ID, lines)
      this.ensureLineLayer(LINE_LAYER_ID, LINE_SOURCE_ID, style.strokeColor, style.strokeWidth, 0.6)
    } else {
      if (this.map.getLayer(LINE_LAYER_ID)) this.map.removeLayer(LINE_LAYER_ID)
      if (this.map.getSource(LINE_SOURCE_ID)) this.map.removeSource(LINE_SOURCE_ID)
    }

    if (config.showShortestOnly || config.showAllLines) {
      this.addOrUpdateSource(SHORTEST_SOURCE_ID, shortest)
      this.ensureLineLayer(SHORTEST_LAYER_ID, SHORTEST_SOURCE_ID, '#ef4444', style.strokeWidth + 1.5, 1)
    } else {
      if (this.map.getLayer(SHORTEST_LAYER_ID)) this.map.removeLayer(SHORTEST_LAYER_ID)
      if (this.map.getSource(SHORTEST_SOURCE_ID)) this.map.removeSource(SHORTEST_SOURCE_ID)
    }

    if (config.showLabels && (config.showAllLines || config.showShortestOnly)) {
      const labelData = config.showAllLines ? labels : {
        type: 'FeatureCollection' as const,
        features: labels.features.filter((f) => {
          const dist = f.properties?.distance as number
          return dist === stats.shortestDistance
        }),
      }
      this.addOrUpdateSource(LABEL_SOURCE_ID, labelData)
      this.ensureLabelLayer()
    } else {
      if (this.map.getLayer(LABEL_LAYER_ID)) this.map.removeLayer(LABEL_LAYER_ID)
      if (this.map.getSource(LABEL_SOURCE_ID)) this.map.removeSource(LABEL_SOURCE_ID)
    }

    this.updateStyle(style)
    return stats
  }

  updateStyle(style: SpatialLayerStyle): void {
    if (this.map.getLayer(LINE_LAYER_ID)) {
      this.map.setPaintProperty(LINE_LAYER_ID, 'line-color', style.strokeColor)
      this.map.setPaintProperty(LINE_LAYER_ID, 'line-width', style.strokeWidth)
    }
  }

  remove(): void {
    for (const layerId of [LABEL_LAYER_ID, SHORTEST_LAYER_ID, LINE_LAYER_ID]) {
      if (this.map.getLayer(layerId)) this.map.removeLayer(layerId)
    }
    for (const sourceId of [LABEL_SOURCE_ID, SHORTEST_SOURCE_ID, LINE_SOURCE_ID]) {
      if (this.map.getSource(sourceId)) this.map.removeSource(sourceId)
    }
  }

  isActive(): boolean {
    return Boolean(this.map.getLayer(LINE_LAYER_ID))
  }

  private computeNearestPairs(geometries: GeoJSON.FeatureCollection<Geometry>) {
    const features = prepareNearestGeometries(geometries)
    const lineFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = []
    const labelFeatures: GeoJSON.Feature<GeoJSON.Point>[] = []
    const visited = new Set<string>()

    let shortestDist = Infinity
    let shortestLine: GeoJSON.Feature<GeoJSON.LineString> | null = null
    let totalDist = 0
    let pairCount = 0

    for (let i = 0; i < features.length; i++) {
      const base = features[i]
      let nearestResult: { targetId: string; distance: number; from: GeoJSON.Position; to: GeoJSON.Position } | null = null

      for (let j = 0; j < features.length; j++) {
        if (i === j) continue
        const candidate = features[j]
        const bboxGap = bboxGapDistanceKm(base.bbox, candidate.bbox)
        if (nearestResult && bboxGap >= nearestResult.distance) continue

        const connection = computeNearestGeometryConnection(base, candidate)
        if (!connection) continue
        if (!nearestResult || connection.distanceKm < nearestResult.distance) {
          nearestResult = {
            targetId: candidate.id,
            distance: connection.distanceKm,
            from: connection.from,
            to: connection.to,
          }
        }
      }

      if (!nearestResult) continue

      const pairKey = [base.id, nearestResult.targetId].sort().join('|')
      if (!visited.has(pairKey)) {
        visited.add(pairKey)

        const line: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [nearestResult.from, nearestResult.to],
          },
          properties: { distance: nearestResult.distance },
        }
        lineFeatures.push(line)

        const midCoords = turf.midpoint(
          turf.point(nearestResult.from),
          turf.point(nearestResult.to),
        ).geometry.coordinates
        const distLabel = nearestResult.distance < 1
          ? `${Math.round(nearestResult.distance * 1000)} m`
          : `${nearestResult.distance.toFixed(1)} km`

        labelFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: midCoords },
          properties: { label: distLabel, distance: nearestResult.distance },
        })

        totalDist += nearestResult.distance
        pairCount++

        if (nearestResult.distance < shortestDist) {
          shortestDist = nearestResult.distance
          shortestLine = line
        }
      }
    }

    const shortestFC: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: shortestLine ? [shortestLine] : [],
    }

    return {
      lines: { type: 'FeatureCollection' as const, features: lineFeatures },
      shortest: shortestFC,
      labels: { type: 'FeatureCollection' as const, features: labelFeatures },
      stats: {
        totalPairs: pairCount,
        shortestDistance: shortestDist === Infinity ? 0 : shortestDist,
        averageDistance: pairCount > 0 ? totalDist / pairCount : 0,
      },
    }
  }

  private addOrUpdateSource(id: string, data: GeoJSON.FeatureCollection): void {
    const existing = this.map.getSource(id) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(data)
    } else {
      this.map.addSource(id, { type: 'geojson', data })
    }
  }

  private ensureLineLayer(
    layerId: string,
    sourceId: string,
    color: string,
    width: number,
    opacity: number,
  ): void {
    if (this.map.getLayer(layerId)) return
    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': color,
        'line-width': width,
        'line-opacity': opacity,
        'line-dasharray': layerId === SHORTEST_LAYER_ID ? [1, 0] : [6, 3],
      },
    })
  }

  private ensureLabelLayer(): void {
    if (this.map.getLayer(LABEL_LAYER_ID)) return
    this.map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: LABEL_SOURCE_ID,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 10,
        // eslint-disable-next-line no-magic-numbers
        'text-offset': [0, -0.8],
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#374151',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    })
  }
}
