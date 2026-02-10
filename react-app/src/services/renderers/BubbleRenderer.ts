/**
 * Bubble Renderer
 * Handles bubble map rendering with variable-size circles
 * Uses MapLibre data-driven styling (GPU-side color rendering)
 */

import type { GeoJSONSource, Map } from 'maplibre-gl'

import { getContinuousColor, getColorPalette } from '../../constants/colorSchemes'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../../types/geojson'
import type { VisualizationSettings } from '../../types/visualization'
import { calculateBreaks } from '../../utils/classification'
import { calculateCentroid } from '../../utils/geometryUtils'
import { normalizeValue } from '../../utils/interpolation'
import { buildInterpolateExpression, buildStepExpression } from '../../utils/mapExpressions'
import { calculateSymbolSize } from '../../utils/symbolShapes'
import { getPlateCodeByName, normalizeTurkishText } from '../../utils/turkishNormalizer'

const NO_DATA_COLOR = 'transparent'
const CONTINUOUS_STOPS = 16

export class BubbleRenderer {
  private map: Map
  private static readonly MIN_RADIUS = 5
  private static readonly MAX_RADIUS = 40

  constructor(map: Map) {
    this.map = map
  }

  /**
   * Render bubble map
   */
  async render(
    geojson: GeoJSONFeatureCollection,
    userData: Record<string, unknown>[],
    dataColumn: string,
    settings: VisualizationSettings,
    locationLevel: 'province' | 'district' = 'province',
  ): Promise<void> {
    // Extract values for classification
    const values = userData
      .map((d) => parseFloat(String(d[dataColumn])))
      .filter((v) => !isNaN(v) && v !== 0)

    if (values.length === 0) {
      console.warn('⚠️  No valid data for visualization')
      return
    }

    // Calculate breaks for color (used in steps mode)
    const isCustom = settings.classificationMethod === 'custom' && settings.customBreaks?.length
    const breaks = isCustom
      ? settings.customBreaks!
      : calculateBreaks(values, settings.classificationMethod, settings.classCount)
    const effectiveClassCount = isCustom ? breaks.length - 1 : settings.classCount
    const colorPalette = getColorPalette(settings.colorScheme, effectiveClassCount)
    const isContinuous = settings.legendType === 'continuous'

    // Find min/max for size scaling
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)

    // Create data map
    const dataMap = this.createDataMap(userData, dataColumn, locationLevel)

    // Process features and convert to bubbles (no color assignment)
    const bubblesGeoJSON = this.processFeatures(
      geojson.features,
      dataMap,
      minValue,
      maxValue,
      locationLevel,
      settings,
    )

    console.debug(
      `⚫ Bubble visualization: ${userData.length} data → ${bubblesGeoJSON.features.length} bubbles on map`,
    )

    // Build MapLibre color expression
    let colorExpression: unknown[]
    if (isContinuous) {
      colorExpression = this.buildContinuousExpression(values, settings)
    } else {
      colorExpression = buildStepExpression('dataValue', breaks, colorPalette, NO_DATA_COLOR)
    }

    // Render to map
    this.renderToMap(bubblesGeoJSON, settings, colorExpression)
  }

  /**
   * Build continuous interpolate expression by sampling color stops from the Chroma scale
   */
  private buildContinuousExpression(
    values: number[],
    settings: VisualizationSettings,
  ): unknown[] {
    const sorted = [...values].sort((a, b) => a - b)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    if (max === min) {
      return ['literal', getContinuousColor(0.5, settings.colorScheme, 'lab')]
    }

    const interpolation = settings.interpolation ?? 'equidistant'
    const colorStops: [number, string][] = []

    for (let i = 0; i < CONTINUOUS_STOPS; i++) {
      const t = i / (CONTINUOUS_STOPS - 1)
      const dataVal = min + t * (max - min)
      const normalized = normalizeValue(dataVal, min, max, interpolation, values)
      const color = getContinuousColor(normalized, settings.colorScheme, 'lab')
      colorStops.push([dataVal, color])
    }

    return buildInterpolateExpression('dataValue', colorStops)
  }

  /**
   * Create data map from user data
   */
  private createDataMap(
    userData: Record<string, unknown>[],
    dataColumn: string,
    locationLevel: 'province' | 'district',
  ): Record<string, number> {
    const dataMap: Record<string, number> = {}

    userData.forEach((d) => {
      const locationName = d.location || d[Object.keys(d)[0]]
      if (locationName) {
        const normalizedKey = normalizeTurkishText(String(locationName))

        // For district level, use composite key
        if (locationLevel === 'district' && d._province) {
          const provinceName = String(d._province)
          const provinceNormalized = normalizeTurkishText(provinceName)
          const compositeKey = `${provinceNormalized}_${normalizedKey}`
          const value = parseFloat(String(d[dataColumn]))
          dataMap[compositeKey] = value

          // Also store plate-code-based key (e.g. "27_sehitkamil")
          const plateCode = getPlateCodeByName(provinceName)
          if (plateCode) {
            dataMap[`${plateCode}_${normalizedKey}`] = value
          }
        } else {
          dataMap[normalizedKey] = parseFloat(String(d[dataColumn]))
        }
      }
    })

    return dataMap
  }

  /**
   * Process GeoJSON features and convert to bubble features (no color assignment)
   */
  private processFeatures(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    minValue: number,
    maxValue: number,
    locationLevel: 'province' | 'district',
    settings: VisualizationSettings,
  ): GeoJSON.FeatureCollection {
    const bubbleFeatures: GeoJSON.Feature[] = []

    features.forEach((feature) => {
      const featureName = this.getFeatureName(feature, locationLevel)
      const normalizedFeatureName = normalizeTurkishText(featureName)

      // Get data value
      const dataValue = this.getDataValue(feature, dataMap, normalizedFeatureName, locationLevel)

      // Skip features without data
      if (dataValue === undefined || dataValue === 0) return

      // Calculate centroid
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const centroid = calculateCentroid(feature.geometry as any)

      // Calculate radius (stays in JS — sqrt/log scaling is complex for expressions)
      const radius = this.calculateSymbolSizeValue(dataValue, minValue, maxValue, settings)

      bubbleFeatures.push({
        type: 'Feature',
        properties: {
          displayName: featureName,
          name: featureName,
          value: dataValue,
          dataValue,
          radius,
          hasData: true,
        },
        geometry: {
          type: 'Point',
          coordinates: centroid,
        },
      })
    })

    return {
      type: 'FeatureCollection',
      features: bubbleFeatures,
    }
  }

  /**
   * Calculate symbol size for a data value using configurable scaling
   */
  private calculateSymbolSizeValue(
    value: number,
    minValue: number,
    maxValue: number,
    settings: VisualizationSettings,
  ): number {
    const minSize = settings.symbolMinSize || BubbleRenderer.MIN_RADIUS
    const maxSize = settings.symbolMaxSize || BubbleRenderer.MAX_RADIUS
    const scaling = settings.symbolScaling || 'sqrt'

    return calculateSymbolSize(value, minValue, maxValue, minSize, maxSize, scaling)
  }

  /**
   * Get feature name based on location level
   */
  private getFeatureName(feature: GeoJSONFeature, locationLevel: 'province' | 'district'): string {
    const props = feature.properties

    if (locationLevel === 'province') {
      return props.ADI || props.ILAD || props.name || props.NAME || props.IL_ADI || 'Bilinmiyor'
    } else {
      return props.ILCEAD || props.ILCE_ADI || props.name || props.NAME || 'Bilinmiyor'
    }
  }

  /**
   * Get data value for a feature
   */
  private getDataValue(
    feature: GeoJSONFeature,
    dataMap: Record<string, number>,
    normalizedFeatureName: string,
    locationLevel: 'province' | 'district',
  ): number | undefined {
    if (locationLevel === 'district') {
      const props = feature.properties

      // Önce GeoJSON key ile dene (benzersiz anahtar)
      if (props.key) {
        const normalizedKey = normalizeTurkishText(String(props.key))
        if (dataMap[normalizedKey] !== undefined) return dataMap[normalizedKey]
      }

      const featureProvinceName = props.ADI || props.ILAD || props.IL_ADI || props.il_adi || props.province

      if (featureProvinceName) {
        const provinceNormalized = normalizeTurkishText(String(featureProvinceName))
        const compositeKey = `${provinceNormalized}_${normalizedFeatureName}`
        if (dataMap[compositeKey] !== undefined) return dataMap[compositeKey]
      }

      // Plaka + ilçe ile dene
      if (props.plaka !== undefined && props.plaka !== null) {
        const plakaKey = `${String(props.plaka).trim()}_${normalizedFeatureName}`
        if (dataMap[plakaKey] !== undefined) return dataMap[plakaKey]
      }
    }

    // Önce normalize edilmiş isimle dene
    if (dataMap[normalizedFeatureName] !== undefined) {
      return dataMap[normalizedFeatureName]
    }

    // Plaka koduyla da dene (il seviyesi: IL, ilçe seviyesi: plaka)
    const props = feature.properties
    const plateCode = props.IL ?? props.plaka
    if (plateCode !== undefined && plateCode !== null) {
      const code = String(plateCode).trim()
      if (dataMap[code] !== undefined) return dataMap[code]
      const numericCode = String(parseInt(code, 10))
      if (dataMap[numericCode] !== undefined) return dataMap[numericCode]
    }

    return undefined
  }

  /**
   * Render processed bubble GeoJSON to map with data-driven color expression
   */
  private renderToMap(
    geojson: GeoJSON.FeatureCollection,
    settings: VisualizationSettings,
    colorExpression: unknown[],
  ): void {
    const sourceId = 'bubble-source'
    const layerId = 'bubble-circles'

    // Get symbol styling settings with defaults
    const opacity = settings.symbolOpacity !== undefined ? settings.symbolOpacity : 0.6
    const strokeColor = settings.symbolStrokeColor || '#ffffff'
    const strokeWidth = settings.symbolStrokeWidth !== undefined ? settings.symbolStrokeWidth : 1.5

    // Add or update source
    if (this.map.getSource(sourceId)) {
      const source = this.map.getSource(sourceId) as GeoJSONSource
      if (source && source.type === 'geojson') {
        source.setData(geojson)
      }
    } else {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
      })
    }

    // Add circle layer with variable size and data-driven color
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: ['==', ['get', 'hasData'], true],
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': colorExpression as Parameters<Map['setPaintProperty']>[2],
          'circle-opacity': opacity,
          'circle-stroke-color': strokeColor,
          'circle-stroke-width': strokeWidth,
        },
      })
    } else {
      this.map.setFilter(layerId, ['==', ['get', 'hasData'], true])
      this.map.setPaintProperty(layerId, 'circle-radius', ['get', 'radius'])
      this.map.setPaintProperty(layerId, 'circle-color', colorExpression)
      this.map.setPaintProperty(layerId, 'circle-opacity', opacity)
      this.map.setPaintProperty(layerId, 'circle-stroke-color', strokeColor)
      this.map.setPaintProperty(layerId, 'circle-stroke-width', strokeWidth)
    }
  }
}
