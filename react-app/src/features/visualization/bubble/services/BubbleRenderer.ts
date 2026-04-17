/**
 * Bubble Renderer
 * Handles bubble map rendering with variable-size circles
 * Uses MapLibre data-driven styling (GPU-side color rendering)
 */

import type { GeoJSONSource, Map } from 'maplibre-gl'

import { getContinuousColor, getColorPalette } from '@/constants/colorSchemes'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '@/types/geojson'
import type { VisualizationSettings } from '@/types/visualization'
import { calculateBreaks } from '@/utils/classification'
import { isPolygonOrMultiPolygon } from '@/utils/geometryTypeGuards'
import { calculateCentroid } from '@/utils/geometryUtils'
import { normalizeValue } from '@/utils/interpolation'
import { buildInterpolateExpression, buildStepExpression } from '@/utils/mapExpressions'
import { applyNormalization } from '@/utils/normalization'
import { calculateSymbolSize } from '@/utils/symbolShapes'
import { formatNumber } from '@/utils/numberFormatter'
import type { NumberFormat } from '@/utils/numberFormatter'
import { getPlateCodeByName, getProvinceByPlateCode, normalizeTurkishText } from '@/utils/turkishNormalizer'

import {
  clampToCustomRange,
  isValueInCustomRange,
  resolveCustomRange,
  type ResolvedCustomRange,
} from '../../shared/customRange'
import { applyLabelLayers } from '../../shared/labelLayers'
import { BUBBLE_DEFAULT_FILL_COLOR } from '../constants'

const NO_DATA_COLOR = 'transparent'
const OUT_OF_RANGE_COLOR = '#dddddd'
const CONTINUOUS_STOPS = 16
const BACKDROP_SOURCE_ID = 'viz-backdrop-source'
const BACKDROP_FILL_LAYER_ID = 'viz-backdrop-fill'
const BACKDROP_OUTLINE_LAYER_ID = 'viz-backdrop-outline'
const BACKDROP_FILL_COLOR = '#e4e4e4'
const DEFAULT_BACKDROP_FILL_OPACITY = 0.22
const BACKDROP_LINE_COLOR = '#94a3b8'
const BACKDROP_LINE_OPACITY = 0.85
const BACKDROP_LINE_WIDTH = 0.8

export class BubbleRenderer {
  private map: Map
  private static readonly MIN_RADIUS = 5
  private static readonly MAX_RADIUS = 20

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
    // Apply normalization if configured
    const normOpts = {
      type: settings.normalization || 'none' as const,
      divisionField: settings.normalizationField,
    }
    const normalizedData = applyNormalization(userData, dataColumn, normOpts)

    // Bivariate: renk sütunu ayrıysa colorColumn kullan, yoksa dataColumn
    const colorColumn = settings.colorColumn || dataColumn
    const isBivariate = colorColumn !== dataColumn

    // Bivariate modda colorColumn da normalize edilmeli — aksi hâlde boyut % cinsinden,
    // renk ham değerle sınıflandırılır (percent-of-total / field normalizasyonunda anlamsız karışım).
    const fullyNormalizedData = isBivariate
      ? applyNormalization(normalizedData, colorColumn, normOpts)
      : normalizedData

    // Extract size values (0 geçerli veri değeridir, yalnızca NaN dışlanır)
    const sizeValues = fullyNormalizedData
      .map((d) => parseFloat(String(d[dataColumn])))
      .filter((v) => !isNaN(v))

    // Extract color values (may be from a different column in bivariate mode)
    const colorValues = isBivariate
      ? fullyNormalizedData
        .map((d) => parseFloat(String(d[colorColumn])))
        .filter((v) => !isNaN(v))
      : sizeValues

    if (sizeValues.length === 0) {
      console.warn('⚠️  No valid data for visualization')
      return
    }

    if (isBivariate && colorValues.length === 0) {
      console.warn('⚠️  Bivariate modda renk sütununda geçerli veri bulunamadı:', colorColumn)
      return
    }

    const resolvedRange = resolveCustomRange(settings.customRange, colorValues)
    const colorValuesForColor = resolvedRange
      ? colorValues.map((v) => clampToCustomRange(v, resolvedRange))
      : colorValues

    // Calculate breaks for color
    const isCustom = settings.classificationMethod === 'custom' && settings.customBreaks?.length
    const breaks = isCustom
      ? settings.customBreaks!
      : calculateBreaks(colorValuesForColor, settings.classificationMethod, settings.classCount)
    // Palette boyutunu her zaman gerçek break sayısına bağla — jenks/kmeans/stddev unique
    // değer yetersizse beklenenden daha az sınıf üretebilir; aksi halde legend'da ziyan renkler kalır.
    const effectiveClassCount = breaks.length - 1
    const colorPalette = getColorPalette(settings.colorScheme, effectiveClassCount)
    const isContinuous = settings.legendType === 'continuous'

    // Find min/max for size scaling
    const minValue = Math.min(...sizeValues)
    const maxValue = Math.max(...sizeValues)

    // Calculate size breaks for graduated mode
    const isGraduated = settings.bubbleSizeMode === 'graduated'
    const sizeBreaks = isGraduated
      ? calculateBreaks(sizeValues, settings.classificationMethod, settings.classCount)
      : undefined

    // Create data maps
    const sizeDataMap = this.createDataMap(fullyNormalizedData, dataColumn, locationLevel)
    const colorDataMap = isBivariate
      ? this.createDataMap(fullyNormalizedData, colorColumn, locationLevel)
      : sizeDataMap

    // Process features and convert to bubbles
    // Custom break modunda sınır dışı kalan feature'lar (value < breaks[0] veya > breaks[last])
    // renk olarak NO_DATA_COLOR alacak ama boyut hesabı devam eder → görünmez baloncuk.
    // colorBreaks sadece isCustom=true'da geçilir; auto-breaks her zaman tüm veriyi kapsar.
    const colorBreaksForFilter = isCustom ? breaks : undefined
    const bubblesGeoJSON = this.processFeatures(
      geojson.features,
      sizeDataMap,
      colorDataMap,
      minValue,
      maxValue,
      locationLevel,
      settings,
      isBivariate,
      sizeBreaks,
      resolvedRange,
      colorBreaksForFilter,
    )

    console.debug(
      `⚫ Bubble visualization: ${userData.length} data → ${bubblesGeoJSON.features.length} bubbles on map` +
      (isBivariate ? ` (bivariate: boyut=${dataColumn}, renk=${colorColumn})` : ''),
    )

    // Build MapLibre color expression
    // Single color fallback (if not bivariate)
    const colorProperty = isBivariate ? 'colorValue' : 'dataValue'
    const isSingleColor = !isBivariate

    let colorExpression: unknown
    if (isSingleColor) {
      colorExpression = settings.symbolFillColor || BUBBLE_DEFAULT_FILL_COLOR
    } else if (isContinuous) {
      colorExpression = this.buildContinuousExpression(
        colorValuesForColor,
        colorValues,
        settings,
        colorProperty,
        resolvedRange ? { min: resolvedRange.min, max: resolvedRange.max } : undefined,
      )
    } else {
      colorExpression = buildStepExpression(colorProperty, breaks, colorPalette, NO_DATA_COLOR)
    }

    if (!isSingleColor && resolvedRange?.outOfRangeMode === 'gray') {
      colorExpression = [
        'case',
        ['==', ['get', 'inCustomRange'], false],
        OUT_OF_RANGE_COLOR,
        colorExpression,
      ]
    }

    // Build label polygons for name/value label layers
    const labelPolygons = this.buildLabelPolygons(geojson.features, sizeDataMap, locationLevel, resolvedRange, settings.valueLabelFormat ?? '1,000.0')

    // Build backdrop with hasData so dataOnlyMode case expression works correctly
    const backdropFeatures = geojson.features.map((feature) => {
      const featureName = this.getFeatureName(feature, locationLevel)
      const normalizedFeatureName = normalizeTurkishText(featureName)
      const dataValue = this.getDataValue(feature, sizeDataMap, normalizedFeatureName, locationLevel)
      return {
        ...feature,
        properties: { ...(feature.properties ?? {}), hasData: dataValue !== undefined },
      } as GeoJSON.Feature
    })

    // Render to map
    this.renderToMap(
      bubblesGeoJSON,
      { type: 'FeatureCollection', features: backdropFeatures },
      labelPolygons,
      settings,
      colorExpression,
      resolvedRange,
    )
  }

  /**
   * Build continuous interpolate expression by sampling color stops from the Chroma scale.
   * domainValues: clamped/filtered values used for min/max domain (linear mapping).
   * warpingValues: original unclamped values used for quantile/natural-break warping so
   * that custom-range clamping does not distort the perceived distribution.
   */
  private buildContinuousExpression(
    domainValues: number[],
    warpingValues: number[],
    settings: VisualizationSettings,
    propertyName: string = 'dataValue',
    domain?: { min: number; max: number },
  ): unknown[] {
    const sorted = [...domainValues].sort((a, b) => a - b)
    const min = domain?.min ?? sorted[0]
    const max = domain?.max ?? sorted[sorted.length - 1]
    if (max === min) {
      return ['literal', getContinuousColor(0.5, settings.colorScheme, 'lab')]
    }

    const interpolation = settings.interpolation ?? 'equidistant'
    const colorStops: [number, string][] = []

    for (let i = 0; i < CONTINUOUS_STOPS; i++) {
      const t = i / (CONTINUOUS_STOPS - 1)
      const dataVal = min + t * (max - min)
      const normalized = normalizeValue(dataVal, min, max, interpolation, warpingValues)
      const color = getContinuousColor(normalized, settings.colorScheme, 'lab')
      colorStops.push([dataVal, color])
    }

    return buildInterpolateExpression(propertyName, colorStops)
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
   * Process GeoJSON features and convert to bubble features
   */
  private processFeatures(
    features: GeoJSONFeature[],
    sizeDataMap: Record<string, number>,
    colorDataMap: Record<string, number>,
    minValue: number,
    maxValue: number,
    locationLevel: 'province' | 'district',
    settings: VisualizationSettings,
    isBivariate: boolean = false,
    sizeBreaks?: number[],
    resolvedRange?: ResolvedCustomRange | null,
    colorBreaks?: number[],
  ): GeoJSON.FeatureCollection {
    const bubbleFeatures: GeoJSON.Feature[] = []

    features.forEach((feature) => {
      const featureName = this.getFeatureName(feature, locationLevel)

      // Provinces: normalize display name via plate code (e.g. "Afyon" → "Afyonkarahisar")
      let displayName = featureName
      if (locationLevel === 'province') {
        const plateCode = getPlateCodeByName(featureName)
        if (plateCode) {
          const officialName = getProvinceByPlateCode(plateCode)
          if (officialName) {
            displayName = officialName
          }
        }
      }

      const normalizedFeatureName = normalizeTurkishText(featureName)

      // Get size data value
      const dataValue = this.getDataValue(feature, sizeDataMap, normalizedFeatureName, locationLevel)

      // Skip features without data (0 geçerli değer; yalnızca tanımsız olanlar atlanır)
      if (dataValue === undefined) return

      // Get color data value (same as size unless bivariate)
      // Bivariate'te renk verisi yoksa null bırakılır; MapLibre step fallback → transparent
      const colorValue = isBivariate
        ? this.getDataValue(feature, colorDataMap, normalizedFeatureName, locationLevel)
        : dataValue
      const inCustomRange = colorValue !== undefined
        ? isValueInCustomRange(colorValue, resolvedRange ?? null)
        : false

      // Custom break modunda sınır dışı kalan feature'lar görünmez baloncuk üretir:
      // boyut hesabı devam eder ama renk NO_DATA_COLOR (transparent) alır.
      // Bu feature'ları tamamen atlamak daha tutarlı bir kullanıcı deneyimi sağlar.
      if (colorBreaks && colorValue !== undefined) {
        if (colorValue < colorBreaks[0] || colorValue > colorBreaks[colorBreaks.length - 1]) return
      }

      // Calculate centroid - only process Polygon/MultiPolygon geometries
      const geometry = feature.geometry
      if (!isPolygonOrMultiPolygon(geometry)) {
        return
      }
      const centroid = calculateCentroid(geometry)

      // Calculate radius — graduated uses class-based sizing, proportional uses continuous scaling
      const radius = sizeBreaks
        ? this.calculateGraduatedRadius(dataValue, sizeBreaks, settings)
        : this.calculateSymbolSizeValue(dataValue, minValue, maxValue, settings)

      bubbleFeatures.push({
        type: 'Feature',
        properties: {
          displayName,
          name: displayName,
          value: dataValue,
          dataValue,
          colorValue: colorValue ?? null,  // null → MapLibre step NO_DATA_COLOR fallback'i tetikler
          inCustomRange,
          radius,
          hasData: true,
        },
        geometry: {
          type: 'Point',
          coordinates: centroid,
        },
      })
    })

    // Z-order: sort descending by radius so large bubbles render first (underneath)
    bubbleFeatures.sort((a, b) => (b.properties!.radius as number) - (a.properties!.radius as number))

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
   * Calculate radius for graduated (class-based) sizing.
   * Each class gets an evenly spaced radius between minSize and maxSize.
   */
  private calculateGraduatedRadius(
    value: number,
    breaks: number[],
    settings: VisualizationSettings,
  ): number {
    const minSize = settings.symbolMinSize || BubbleRenderer.MIN_RADIUS
    const maxSize = settings.symbolMaxSize || BubbleRenderer.MAX_RADIUS
    const classCount = breaks.length - 1

    // Find which class this value belongs to
    let classIndex = 0
    for (let i = 1; i < breaks.length; i++) {
      if (value > breaks[i]) {
        classIndex = i
      } else {
        classIndex = i - 1
        break
      }
    }
    // Clamp to last class
    classIndex = Math.min(classIndex, classCount - 1)

    // Evenly spaced radius per class
    if (classCount <= 1) return (minSize + maxSize) / 2
    return minSize + (classIndex / (classCount - 1)) * (maxSize - minSize)
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
   * Build enriched polygon GeoJSON for label layers (displayName, dataValue, hasData)
   */
  private buildLabelPolygons(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    locationLevel: 'province' | 'district',
    resolvedRange: ResolvedCustomRange | null = null,
    valueLabelFormat: NumberFormat = '1,000.0',
  ): GeoJSON.FeatureCollection {
    const seen = new Set<string>()
    const pointFeatures: GeoJSON.Feature[] = []

    features.forEach((feature) => {
      const geometry = feature.geometry
      if (!isPolygonOrMultiPolygon(geometry)) return

      const featureName = this.getFeatureName(feature, locationLevel)
      let displayName = featureName
      if (locationLevel === 'province') {
        const plateCode = getPlateCodeByName(featureName)
        if (plateCode) {
          const officialName = getProvinceByPlateCode(plateCode)
          if (officialName) displayName = officialName
        }
      }

      const provinceHint = locationLevel === 'district'
        ? String(feature.properties.ADI || feature.properties.ILAD || feature.properties.IL_ADI || feature.properties.il_adi || feature.properties.province || '')
        : ''
      const dedupKey = provinceHint ? `${provinceHint}__${displayName}` : displayName
      if (seen.has(dedupKey)) return
      seen.add(dedupKey)

      const normalizedFeatureName = normalizeTurkishText(featureName)
      const dataValue = this.getDataValue(feature, dataMap, normalizedFeatureName, locationLevel)
      const centroid = calculateCentroid(geometry)

      pointFeatures.push({
        type: 'Feature',
        properties: {
          displayName,
          dataValue: dataValue ?? 0,
          formattedValue: dataValue !== undefined ? formatNumber(dataValue, valueLabelFormat) : '',
          hasData: dataValue !== undefined,
          inCustomRange: dataValue !== undefined ? isValueInCustomRange(dataValue, resolvedRange) : false,
        },
        geometry: { type: 'Point', coordinates: centroid },
      })
    })

    return { type: 'FeatureCollection', features: pointFeatures }
  }

  /**
   * Render name and value label layers on top of the visualization
   */
  private renderLabelLayers(sourceId: string, settings: VisualizationSettings): void {
    applyLabelLayers(this.map, sourceId, settings)
  }

  /**
   * Render processed bubble GeoJSON to map with data-driven color expression
   */
  private renderToMap(
    geojson: GeoJSON.FeatureCollection,
    backdropGeoJSON: GeoJSON.FeatureCollection,
    labelPolygonGeoJSON: GeoJSON.FeatureCollection,
    settings: VisualizationSettings,
    colorExpression: unknown,
    resolvedRange: ResolvedCustomRange | null,
  ): void {
    const sourceId = 'bubble-source'
    const layerId = 'bubble-circles'
    const layerFilter: NonNullable<Parameters<Map['setFilter']>[1]> =
      resolvedRange?.outOfRangeMode === 'transparent'
        ? ['all', ['==', ['get', 'hasData'], true], ['==', ['get', 'inCustomRange'], true]]
        : ['==', ['get', 'hasData'], true]

    const opacity = settings.symbolOpacity !== undefined ? settings.symbolOpacity : 0.6
    const strokeColor = settings.symbolStrokeColor || '#ffffff'
    const strokeWidth = settings.symbolStrokeWidth !== undefined ? settings.symbolStrokeWidth : 0.5
    const backdropFillOpacity = settings.backdropFillOpacity ?? DEFAULT_BACKDROP_FILL_OPACITY
    const effectiveBackdropFillOpacity: unknown = settings.dataOnlyMode
      ? ['case', ['==', ['get', 'hasData'], true], backdropFillOpacity, 0]
      : backdropFillOpacity
    const effectiveBackdropLineOpacity: unknown = settings.dataOnlyMode
      ? ['case', ['==', ['get', 'hasData'], true], BACKDROP_LINE_OPACITY, 0]
      : BACKDROP_LINE_OPACITY
    const circleLayerExists = Boolean(this.map.getLayer(layerId))

    // Add or update backdrop source
    if (this.map.getSource(BACKDROP_SOURCE_ID)) {
      const source = this.map.getSource(BACKDROP_SOURCE_ID) as GeoJSONSource
      if (source && source.type === 'geojson') {
        source.setData(backdropGeoJSON)
      }
    } else {
      this.map.addSource(BACKDROP_SOURCE_ID, {
        type: 'geojson',
        data: backdropGeoJSON,
      })
    }

    const backdropFillColor = settings.noDataColor ?? BACKDROP_FILL_COLOR

    // Add backdrop fill layer (always under circles)
    if (!this.map.getLayer(BACKDROP_FILL_LAYER_ID)) {
      this.map.addLayer({
        id: BACKDROP_FILL_LAYER_ID,
        type: 'fill',
        source: BACKDROP_SOURCE_ID,
        paint: {
          'fill-color': backdropFillColor,
          'fill-opacity': backdropFillOpacity,
        },
      }, circleLayerExists ? layerId : undefined)
      this.map.setPaintProperty(BACKDROP_FILL_LAYER_ID, 'fill-opacity', effectiveBackdropFillOpacity)
    } else {
      this.map.setPaintProperty(BACKDROP_FILL_LAYER_ID, 'fill-color', backdropFillColor)
      this.map.setPaintProperty(BACKDROP_FILL_LAYER_ID, 'fill-opacity', effectiveBackdropFillOpacity)
    }

    // Add backdrop outline layer (always under circles)
    if (!this.map.getLayer(BACKDROP_OUTLINE_LAYER_ID)) {
      this.map.addLayer({
        id: BACKDROP_OUTLINE_LAYER_ID,
        type: 'line',
        source: BACKDROP_SOURCE_ID,
        paint: {
          'line-color': BACKDROP_LINE_COLOR,
          'line-opacity': BACKDROP_LINE_OPACITY,
          'line-width': BACKDROP_LINE_WIDTH,
        },
      }, circleLayerExists ? layerId : undefined)
      this.map.setPaintProperty(BACKDROP_OUTLINE_LAYER_ID, 'line-opacity', effectiveBackdropLineOpacity)
    } else {
      this.map.setPaintProperty(BACKDROP_OUTLINE_LAYER_ID, 'line-color', BACKDROP_LINE_COLOR)
      this.map.setPaintProperty(BACKDROP_OUTLINE_LAYER_ID, 'line-opacity', effectiveBackdropLineOpacity)
      this.map.setPaintProperty(BACKDROP_OUTLINE_LAYER_ID, 'line-width', BACKDROP_LINE_WIDTH)
    }

    // Add or update viz-label-source for name/value labels
    if (this.map.getSource('viz-label-source')) {
      (this.map.getSource('viz-label-source') as GeoJSONSource).setData(labelPolygonGeoJSON)
    } else {
      this.map.addSource('viz-label-source', { type: 'geojson', data: labelPolygonGeoJSON })
    }

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

    // Fixed radius based on user's min/max settings (matches legend exactly at all zoom levels)
    const radiusExpression: unknown[] = ['get', 'radius']

    // Add circle layer with variable size and data-driven color
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: layerFilter,
        layout: {
          // Z-order: smaller radius → higher sort key → drawn on top
          'circle-sort-key': ['-', 0, ['get', 'radius']],
        },
        paint: {
          'circle-radius': radiusExpression as Parameters<Map['setPaintProperty']>[2],
          'circle-color': colorExpression as Parameters<Map['setPaintProperty']>[2],
          'circle-opacity': opacity,
          'circle-stroke-color': strokeColor,
          'circle-stroke-width': strokeWidth,
        },
      })
    } else {
      this.map.setFilter(layerId, layerFilter)
      this.map.setPaintProperty(layerId, 'circle-radius', radiusExpression)
      this.map.setPaintProperty(layerId, 'circle-color', colorExpression as Parameters<Map['setPaintProperty']>[2])
      this.map.setPaintProperty(layerId, 'circle-opacity', opacity)
      this.map.setPaintProperty(layerId, 'circle-stroke-color', strokeColor)
      this.map.setPaintProperty(layerId, 'circle-stroke-width', strokeWidth)
    }

    this.renderLabelLayers('viz-label-source', settings)
  }
}
