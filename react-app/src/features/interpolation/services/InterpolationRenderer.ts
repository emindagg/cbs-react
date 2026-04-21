import type { GeoJSONSource, ImageSource, Map as MapLibreMap } from 'maplibre-gl'

import { generateColorScale } from '@/utils/colorInterpolation'

import type {
  InterpolationColorRamp,
  InterpolationConfig,
  InterpolationRaster,
  InterpolationResult,
} from '../types'
import { resolveEffectiveSymbology } from './symbologyConstraints'

const SOURCE_ID = 'interpolation-source'
const FILL_LAYER_ID = 'interpolation-fill'
const LINE_LAYER_ID = 'interpolation-line'

const RASTER_SOURCE_ID = 'interpolation-raster-source'
const RASTER_LAYER_ID = 'interpolation-raster-layer'
const VALUE_SOURCE_ID = 'interpolation-value-source'
const VALUE_POINT_LAYER_ID = 'interpolation-value-point'
const VALUE_LABEL_LAYER_ID = 'interpolation-value-label'

const COLOR_RAMPS: Record<InterpolationColorRamp, string[]> = {
  spectral: ['#313695', '#74add1', '#ffffbf', '#fdae61', '#a50026'],
  'spectral-reverse': ['#a50026', '#fdae61', '#ffffbf', '#74add1', '#313695'],
  'green-red': ['#1a9850', '#91cf60', '#d9ef8b', '#ffffbf', '#fee08b', '#fc8d59', '#d73027'],
  'red-green': ['#d73027', '#fc8d59', '#fee08b', '#ffffbf', '#d9ef8b', '#91cf60', '#1a9850'],
  viridis: ['#440154', '#3b528b', '#21908c', '#5dc863', '#fde725'],
  magma: ['#000004', '#51127c', '#b63679', '#fc8961', '#fcfdbf'],
  terrain: ['#419444', '#92c253', '#e4d284', '#a16d41', '#ffffff'],
  blues: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
  reds: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'],
}

export function getRampColors(ramp: InterpolationColorRamp, steps = 5): string[] {
  return generateColorScale(COLOR_RAMPS[ramp] ?? COLOR_RAMPS.spectral, steps, 'lab')
}

function buildFillColorExpression(
  min: number,
  max: number,
  ramp: InterpolationColorRamp,
  classCount: number,
  isClassified: boolean,
): unknown {
  const safeMax = max > min ? max : min + 1
  const range = safeMax - min

  if (isClassified) {
    const count = Math.max(3, Math.min(classCount, 15))
    const colors = getRampColors(ramp, count)
    const expr: unknown[] = ['step', ['get', 'value'], colors[0]]
    for (let i = 1; i < count; i++) {
      expr.push(min + (range * i) / count, colors[i])
    }
    return expr
  }

  const colors = getRampColors(ramp, 5)
  return [
    'interpolate',
    ['linear'],
    ['get', 'value'],
    min, colors[0],
    min + range * 0.25, colors[1],
    min + range * 0.5, colors[2],
    min + range * 0.75, colors[3],
    safeMax, colors[4],
  ]
}

// "#rrggbb" → [r, g, b]
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  const full = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h
  const num = parseInt(full, 16)
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
}

// Sürekli (stretch) mod için renk arama tablosu — 256 ara renk
function buildStretchLUT(ramp: InterpolationColorRamp): Uint8Array {
  const colors = getRampColors(ramp, 256).map(hexToRgb)
  const lut = new Uint8Array(256 * 3)
  for (let i = 0; i < 256; i++) {
    lut[i * 3] = colors[i][0]
    lut[i * 3 + 1] = colors[i][1]
    lut[i * 3 + 2] = colors[i][2]
  }
  return lut
}

// Sınıflandırılmış mod için renk listesi (her sınıf için bir renk)
function buildClassifiedColors(ramp: InterpolationColorRamp, classCount: number): Uint8Array {
  const count = Math.max(3, Math.min(classCount, 15))
  const colors = getRampColors(ramp, count).map(hexToRgb)
  const out = new Uint8Array(count * 3)
  for (let i = 0; i < count; i++) {
    out[i * 3] = colors[i][0]
    out[i * 3 + 1] = colors[i][1]
    out[i * 3 + 2] = colors[i][2]
  }
  return out
}

// Raster değerlerini renk paletine göre RGBA ImageData'ya çevirir
function rasterToImageData(
  raster: InterpolationRaster,
  config: InterpolationConfig,
  min: number,
  max: number,
): ImageData {
  const { width, height, values } = raster
  const safeMax = max > min ? max : min + 1
  const range = safeMax - min
  // Pürüzsüz modda symbology kısıtı symbologyConstraints helper'ı tarafından uygulanır.
  const isClassified = resolveEffectiveSymbology(config) === 'classify'

  const data = new Uint8ClampedArray(width * height * 4)

  if (isClassified) {
    const count = Math.max(3, Math.min(config.classCount, 15))
    const palette = buildClassifiedColors(config.colorRamp, count)
    for (let i = 0; i < values.length; i++) {
      const v = values[i]
      let idx: number
      if (!isFinite(v)) {
        idx = 0
      } else {
        const t = (v - min) / range
        idx = Math.min(count - 1, Math.max(0, Math.floor(t * count)))
      }
      const di = i * 4
      data[di] = palette[idx * 3]
      data[di + 1] = palette[idx * 3 + 1]
      data[di + 2] = palette[idx * 3 + 2]
      data[di + 3] = 255
    }
  } else {
    const lut = buildStretchLUT(config.colorRamp)
    for (let i = 0; i < values.length; i++) {
      const v = values[i]
      let idx: number
      if (!isFinite(v)) {
        idx = 0
      } else {
        const t = (v - min) / range
        idx = Math.min(255, Math.max(0, Math.round(t * 255)))
      }
      const di = i * 4
      data[di] = lut[idx * 3]
      data[di + 1] = lut[idx * 3 + 1]
      data[di + 2] = lut[idx * 3 + 2]
      data[di + 3] = 255
    }
  }

  return new ImageData(data, width, height)
}

export class InterpolationRenderer {
  private map: MapLibreMap

  constructor(map: MapLibreMap) {
    this.map = map
  }

  render(result: InterpolationResult, config: InterpolationConfig): void {
    if (result.raster) {
      this.removeVectorLayers()
      this.renderRaster(result.raster, config, result.min, result.max)
    } else if (result.grid) {
      this.removeRasterLayers()
      this.renderVector(result.grid as GeoJSON.FeatureCollection, config, result.min, result.max)
    }

    // Etiket katmanlarını en son ekle/güncelle ki her zaman dolgu/raster'ın üstünde kalsın
    this.renderValueLabels(result.points as GeoJSON.FeatureCollection, config)
    this.bringValueLayersToFront()
  }

  private bringValueLayersToFront(): void {
    // Önce noktayı stack'in en üstüne çıkar, sonra label'ı onun üstüne koy.
    // moveLayer(id) beforeId olmadan = stack'in en sonuna taşır; iki çağrı sonrası
    // label en üstte, nokta hemen altında kalır. Etiketler daima noktanın üstünde görünür.
    if (this.map.getLayer(VALUE_POINT_LAYER_ID)) {
      this.map.moveLayer(VALUE_POINT_LAYER_ID)
    }
    if (this.map.getLayer(VALUE_LABEL_LAYER_ID)) {
      this.map.moveLayer(VALUE_LABEL_LAYER_ID)
    }
  }

  private renderVector(
    grid: GeoJSON.FeatureCollection,
    config: InterpolationConfig,
    min: number,
    max: number,
  ): void {
    const isClassified = resolveEffectiveSymbology(config) === 'classify'
    const expression = buildFillColorExpression(
      min,
      max,
      config.colorRamp,
      config.classCount,
      isClassified,
    )

    this.addOrUpdateVectorSource(grid)
    this.addOrUpdateVectorLayers(config, expression)
    this.updateVectorStyle(config, expression)
  }

  private renderRaster(
    raster: InterpolationRaster,
    config: InterpolationConfig,
    min: number,
    max: number,
  ): void {
    const imageData = rasterToImageData(raster, config, min, max)
    const canvas = document.createElement('canvas')
    canvas.width = raster.width
    canvas.height = raster.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.putImageData(imageData, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')

    const [w, s, e, n] = raster.bbox
    // MapLibre image source koordinatları: [TL, TR, BR, BL]
    const coordinates: [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ] = [
      [w, n],
      [e, n],
      [e, s],
      [w, s],
    ]

    const existing = this.map.getSource(RASTER_SOURCE_ID) as ImageSource | undefined
    if (existing) {
      existing.updateImage({ url: dataUrl, coordinates })
    } else {
      this.map.addSource(RASTER_SOURCE_ID, {
        type: 'image',
        url: dataUrl,
        coordinates,
      })
    }

    if (!this.map.getLayer(RASTER_LAYER_ID)) {
      this.map.addLayer({
        id: RASTER_LAYER_ID,
        type: 'raster',
        source: RASTER_SOURCE_ID,
        paint: {
          'raster-opacity': config.fillOpacity,
          'raster-resampling': 'linear',
          'raster-fade-duration': 0,
        },
      })
    } else {
      this.map.setPaintProperty(RASTER_LAYER_ID, 'raster-opacity', config.fillOpacity)
    }
  }

  private updateVectorStyle(config: InterpolationConfig, expression: unknown): void {
    if (!this.map.getLayer(FILL_LAYER_ID)) return
    this.map.setPaintProperty(FILL_LAYER_ID, 'fill-color', expression as never)
    this.map.setPaintProperty(FILL_LAYER_ID, 'fill-opacity', config.fillOpacity)
    this.map.setPaintProperty(LINE_LAYER_ID, 'line-opacity', 0)
  }

  remove(): void {
    this.removeVectorLayers()
    this.removeRasterLayers()
    this.removeValueLayers()
  }

  private removeVectorLayers(): void {
    if (this.map.getLayer(LINE_LAYER_ID)) this.map.removeLayer(LINE_LAYER_ID)
    if (this.map.getLayer(FILL_LAYER_ID)) this.map.removeLayer(FILL_LAYER_ID)
    if (this.map.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID)
  }

  private removeRasterLayers(): void {
    if (this.map.getLayer(RASTER_LAYER_ID)) this.map.removeLayer(RASTER_LAYER_ID)
    if (this.map.getSource(RASTER_SOURCE_ID)) this.map.removeSource(RASTER_SOURCE_ID)
  }

  private removeValueLayers(): void {
    if (this.map.getLayer(VALUE_LABEL_LAYER_ID)) this.map.removeLayer(VALUE_LABEL_LAYER_ID)
    if (this.map.getLayer(VALUE_POINT_LAYER_ID)) this.map.removeLayer(VALUE_POINT_LAYER_ID)
    if (this.map.getSource(VALUE_SOURCE_ID)) this.map.removeSource(VALUE_SOURCE_ID)
  }

  isActive(): boolean {
    return Boolean(this.map.getLayer(FILL_LAYER_ID) || this.map.getLayer(RASTER_LAYER_ID))
  }

  private addOrUpdateVectorSource(geojson: GeoJSON.FeatureCollection): void {
    const existing = this.map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(geojson)
    } else {
      this.map.addSource(SOURCE_ID, { type: 'geojson', data: geojson })
    }
  }

  private addOrUpdateVectorLayers(config: InterpolationConfig, expression: unknown): void {
    if (!this.map.getLayer(FILL_LAYER_ID)) {
      this.map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': expression as never,
          'fill-opacity': config.fillOpacity,
          'fill-outline-color': 'transparent',
        },
      })
    }

    if (!this.map.getLayer(LINE_LAYER_ID)) {
      this.map.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'line-color': 'transparent',
          'line-width': 0,
          'line-opacity': 0,
        },
      })
    }
  }

  private renderValueLabels(points: GeoJSON.FeatureCollection, config: InterpolationConfig): void {
    const existing = this.map.getSource(VALUE_SOURCE_ID) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(points)
    } else {
      this.map.addSource(VALUE_SOURCE_ID, { type: 'geojson', data: points })
    }

    if (!this.map.getLayer(VALUE_POINT_LAYER_ID)) {
      this.map.addLayer({
        id: VALUE_POINT_LAYER_ID,
        type: 'circle',
        source: VALUE_SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 3.5,
          'circle-color': '#f97316',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.2,
          'circle-opacity': 0.95,
        },
      })
    }

    if (!this.map.getLayer(VALUE_LABEL_LAYER_ID)) {
      this.map.addLayer({
        id: VALUE_LABEL_LAYER_ID,
        type: 'symbol',
        source: VALUE_SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Point'],
        layout: {
          'text-field': ['coalesce', ['get', 'label'], ['to-string', ['get', 'value']]],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
          'text-offset': [0, -0.9],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1.2,
        },
      })
    }

    const visible = config.showPointValues ? 'visible' : 'none'
    this.map.setLayoutProperty(VALUE_POINT_LAYER_ID, 'visibility', visible)
    this.map.setLayoutProperty(VALUE_LABEL_LAYER_ID, 'visibility', visible)
  }
}
