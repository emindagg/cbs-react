import type { Map, GeoJSONSource } from 'maplibre-gl'

import type { HeatmapConfig } from '../types'

const SOURCE_ID = 'heatmap-source'
const LAYER_ID = 'heatmap-layer'
const CIRCLE_LAYER_ID = 'heatmap-circles'
const ZOOM_THRESHOLD = 14

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
    this.map.setPaintProperty(LAYER_ID, 'heatmap-opacity', this.buildHeatmapOpacityExpression(config.opacity))
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

    if (this.map.getLayer(CIRCLE_LAYER_ID)) {
      const lastColor = config.colorStops[config.colorStops.length - 1][1]
      this.map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-color', lastColor)
      this.map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-opacity', this.buildCircleOpacityExpression(config.opacity))
      this.map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-stroke-opacity', this.buildCircleOpacityExpression(config.opacity))
    }
  }

  remove(): void {
    if (this.map.getLayer(CIRCLE_LAYER_ID)) {
      this.map.removeLayer(CIRCLE_LAYER_ID)
    }
    if (this.map.getLayer(LAYER_ID)) {
      this.map.removeLayer(LAYER_ID)
    }
    if (this.map.getSource(SOURCE_ID)) {
      this.map.removeSource(SOURCE_ID)
    }
  }

  isActive(): boolean {
    return Boolean(this.map.getLayer(LAYER_ID) || this.map.getLayer(CIRCLE_LAYER_ID))
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
        'heatmap-opacity': this.buildHeatmapOpacityExpression(config.opacity) as Parameters<Map['setPaintProperty']>[2],
        'heatmap-color': this.buildColorExpression(config) as Parameters<Map['setPaintProperty']>[2],
      },
    })

    this.addCircleLayer(config)
  }

  private addCircleLayer(config: HeatmapConfig): void {
    if (this.map.getLayer(CIRCLE_LAYER_ID)) return
    const lastColor = config.colorStops[config.colorStops.length - 1][1]
    this.map.addLayer({
      id: CIRCLE_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'],
          ZOOM_THRESHOLD, 3,
          18, 8,
        ] as Parameters<Map['setPaintProperty']>[2],
        'circle-color': lastColor,
        'circle-opacity': this.buildCircleOpacityExpression(config.opacity) as Parameters<Map['setPaintProperty']>[2],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.6)',
        'circle-stroke-opacity': this.buildCircleOpacityExpression(config.opacity) as Parameters<Map['setPaintProperty']>[2],
      },
    })
  }

  private buildRadiusExpression(radius: number): unknown {
    return [
      'interpolate', ['linear'], ['zoom'],
      0, radius * 1.6,
      5, radius * 1.2,
      9, radius,
      15, radius * 0.6,
    ]
  }

  private buildIntensityExpression(intensity: number): unknown {
    return [
      'interpolate', ['linear'], ['zoom'],
      0, intensity * 2,
      5, intensity * 1.5,
      9, intensity,
      15, intensity * 3,
    ]
  }

  private buildHeatmapOpacityExpression(opacity: number): unknown {
    return [
      'interpolate', ['linear'], ['zoom'],
      ZOOM_THRESHOLD - 1, opacity,
      ZOOM_THRESHOLD, 0,
    ]
  }

  private buildCircleOpacityExpression(opacity: number): unknown {
    return [
      'interpolate', ['linear'], ['zoom'],
      ZOOM_THRESHOLD - 1, 0,
      ZOOM_THRESHOLD, opacity,
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
