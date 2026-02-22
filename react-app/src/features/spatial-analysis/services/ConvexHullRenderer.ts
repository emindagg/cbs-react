import * as turf from '@turf/turf'
import type { Map, GeoJSONSource } from 'maplibre-gl'

import type { SpatialLayerStyle } from '../types'

const SOURCE_ID = 'convex-hull-source'
const FILL_LAYER_ID = 'convex-hull-fill'
const LINE_LAYER_ID = 'convex-hull-line'

export class ConvexHullRenderer {
  private map: Map

  constructor(map: Map) {
    this.map = map
  }

  render(points: GeoJSON.FeatureCollection<GeoJSON.Point>, style: SpatialLayerStyle): void {
    if (points.features.length < 3) return

    const hull = turf.convex(points)
    if (!hull) return

    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [hull],
    }

    this.addOrUpdateSource(fc)
    this.addOrUpdateLayers(style)
  }

  updateStyle(style: SpatialLayerStyle): void {
    if (!this.map.getLayer(FILL_LAYER_ID)) return
    this.map.setPaintProperty(FILL_LAYER_ID, 'fill-color', style.fillColor)
    this.map.setPaintProperty(FILL_LAYER_ID, 'fill-opacity', style.fillOpacity)
    this.map.setPaintProperty(LINE_LAYER_ID, 'line-color', style.strokeColor)
    this.map.setPaintProperty(LINE_LAYER_ID, 'line-width', style.strokeWidth)
  }

  remove(): void {
    if (this.map.getLayer(LINE_LAYER_ID)) this.map.removeLayer(LINE_LAYER_ID)
    if (this.map.getLayer(FILL_LAYER_ID)) this.map.removeLayer(FILL_LAYER_ID)
    if (this.map.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID)
  }

  isActive(): boolean {
    return Boolean(this.map.getLayer(FILL_LAYER_ID))
  }

  private addOrUpdateSource(geojson: GeoJSON.FeatureCollection): void {
    const existing = this.map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(geojson)
    } else {
      this.map.addSource(SOURCE_ID, { type: 'geojson', data: geojson })
    }
  }

  private addOrUpdateLayers(style: SpatialLayerStyle): void {
    if (!this.map.getLayer(FILL_LAYER_ID)) {
      this.map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': style.fillColor,
          'fill-opacity': style.fillOpacity,
        },
      })
    }

    if (!this.map.getLayer(LINE_LAYER_ID)) {
      this.map.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': style.strokeColor,
          'line-width': style.strokeWidth,
          'line-dasharray': [4, 2],
        },
      })
    }

    this.updateStyle(style)
  }
}
