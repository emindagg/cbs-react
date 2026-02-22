import type { Map, GeoJSONSource } from 'maplibre-gl'

import type { HeatmapConfig } from '../types'

const SOURCE_ID = 'heatmap-source'
const LAYER_ID = 'heatmap-layer'

export class HeatmapRenderer {
  private map: Map

  constructor(map: Map) {
    this.map = map
  }

  render(geojson: GeoJSON.FeatureCollection, config: HeatmapConfig): void {
    this.addOrUpdateSource(geojson)
    this.addOrUpdateLayer(config)
  }

  updateConfig(config: HeatmapConfig): void {
    if (!this.map.getLayer(LAYER_ID)) return

    this.map.setPaintProperty(LAYER_ID, 'heatmap-radius', this.buildRadiusExpression(config.radius))
    this.map.setPaintProperty(LAYER_ID, 'heatmap-intensity', this.buildIntensityExpression(config.intensity))
    this.map.setPaintProperty(LAYER_ID, 'heatmap-opacity', config.opacity)
    this.map.setPaintProperty(LAYER_ID, 'heatmap-color', this.buildColorExpression(config))

    if (config.weightField) {
      this.map.setPaintProperty(LAYER_ID, 'heatmap-weight', [
        'interpolate', ['linear'], ['get', config.weightField],
        0, 0,
        1, 1,
      ])
    } else {
      this.map.setPaintProperty(LAYER_ID, 'heatmap-weight', 1)
    }
  }

  remove(): void {
    if (this.map.getLayer(LAYER_ID)) {
      this.map.removeLayer(LAYER_ID)
    }
    if (this.map.getSource(SOURCE_ID)) {
      this.map.removeSource(SOURCE_ID)
    }
  }

  isActive(): boolean {
    return Boolean(this.map.getLayer(LAYER_ID))
  }

  private addOrUpdateSource(geojson: GeoJSON.FeatureCollection): void {
    const existing = this.map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(geojson)
    } else {
      this.map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      })
    }
  }

  private addOrUpdateLayer(config: HeatmapConfig): void {
    if (this.map.getLayer(LAYER_ID)) {
      this.updateConfig(config)
      return
    }

    const weightProp: unknown = config.weightField
      ? ['interpolate', ['linear'], ['get', config.weightField], 0, 0, 1, 1]
      : 1

    this.map.addLayer({
      id: LAYER_ID,
      type: 'heatmap',
      source: SOURCE_ID,
      paint: {
        'heatmap-weight': weightProp as Parameters<Map['setPaintProperty']>[2],
        'heatmap-intensity': this.buildIntensityExpression(config.intensity) as Parameters<Map['setPaintProperty']>[2],
        'heatmap-radius': this.buildRadiusExpression(config.radius) as Parameters<Map['setPaintProperty']>[2],
        'heatmap-opacity': config.opacity,
        'heatmap-color': this.buildColorExpression(config) as Parameters<Map['setPaintProperty']>[2],
      },
    })
  }

  private buildRadiusExpression(radius: number): unknown {
    return [
      'interpolate', ['linear'], ['zoom'],
      0, Math.max(1, radius * 0.3),
      9, radius,
      15, radius * 2.5,
    ]
  }

  private buildIntensityExpression(intensity: number): unknown {
    return [
      'interpolate', ['linear'], ['zoom'],
      0, 0,
      9, intensity,
      15, intensity * 3,
    ]
  }

  private buildColorExpression(config: HeatmapConfig): unknown {
    const stops: unknown[] = []
    for (const [value, color] of config.colorStops) {
      stops.push(value, color)
    }
    return ['interpolate', ['linear'], ['heatmap-density'], ...stops]
  }
}
