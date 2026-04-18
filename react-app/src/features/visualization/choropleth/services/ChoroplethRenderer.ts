/**
 * Choropleth Renderer
 * Handles choropleth map rendering with classification and coloring
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

const NO_DATA_COLOR = '#e4e4e4'
const CONTINUOUS_STOPS = 16

export class ChoroplethRenderer {
  private map: Map

  /**
   * Per-map cache of the base color expression (before hasData wrap).
   * Static WeakMap ensures it survives across VisualizationManager re-instantiations.
   */
  static readonly expressionCache = new WeakMap<Map, unknown[]>()

  /** Instance accessor — delegates to the static cache */
  get lastBaseColorExpression(): unknown[] | null {
    return ChoroplethRenderer.expressionCache.get(this.map) ?? null
  }

  constructor(map: Map) {
    this.map = map
  }

  /**
     * Render choropleth map
     */
  async render(
    geojson: GeoJSONFeatureCollection,
    userData: Record<string, unknown>[],
    dataColumn: string,
    settings: VisualizationSettings,
    locationLevel: 'province' | 'district' = 'province',
  ): Promise<void> {
    // Extract values for classification (0 geçerli veri değeridir, yalnızca NaN dışlanır)
    const values = userData
      .map((d) => parseFloat(String(d[dataColumn])))
      .filter((v) => !isNaN(v))

    if (values.length === 0) {
      console.warn('⚠️  No valid data for visualization')
      return
    }

    const resolvedRange = resolveCustomRange(settings.customRange, values)
    const valuesForColor = resolvedRange
      ? values.map((v) => clampToCustomRange(v, resolvedRange))
      : values

    // Calculate breaks and palette
    const isCustom = settings.classificationMethod === 'custom' && settings.customBreaks?.length
    const breaks = isCustom
      ? settings.customBreaks!
      : calculateBreaks(valuesForColor, settings.classificationMethod, settings.classCount)
    // Palette boyutunu her zaman gerçek break sayısına bağla — jenks/stddev unique
    // değer yetersizse beklenenden daha az sınıf üretebilir; aksi halde legend'da ziyan renkler kalır.
    const effectiveClassCount = breaks.length - 1
    const colorPalette = getColorPalette(settings.colorScheme, effectiveClassCount)
    const isContinuous = settings.legendType === 'continuous'

    // Create data map
    const dataMap = this.createDataMap(userData, dataColumn, locationLevel)

    // Process all features — only assigns dataValue/hasData, no color
    const { allFeatures, featuresWithData } = this.processFeatures(
      geojson.features,
      dataMap,
      locationLevel,
      resolvedRange,
    )

    const allFeaturesGeoJSON: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: allFeatures.map(f => ({
        ...f,
        properties: f.properties || {},
      })),
    }

    console.debug(
      `📊 Visualization: ${userData.length} data → ${featuresWithData.length} ${locationLevel === 'province' ? 'provinces' : 'districts'} on map (Total: ${allFeatures.length})`,
    )

    // Build MapLibre color expression
    let colorExpression: unknown[]
    if (isContinuous) {
      colorExpression = this.buildContinuousExpression(
        valuesForColor,
        values,
        settings,
        resolvedRange ? { min: resolvedRange.min, max: resolvedRange.max } : undefined,
      )
    } else {
      colorExpression = buildStepExpression('dataValue', breaks, colorPalette, NO_DATA_COLOR)

      // Özel sınıflarda: min değerinin altında ve max sınır değerini aşan veriler gri renk alır
      // (MapLibre step ifadesi ilk rengi sınırsız olarak değerlerin altına, son rengi üstüne uygular)
      if (isCustom) {
        const minBreak = breaks[0]
        const maxBreak = breaks[breaks.length - 1]
        colorExpression = [
          'case',
          ['<', ['get', 'dataValue'], minBreak],
          NO_DATA_COLOR,
          ['>', ['get', 'dataValue'], maxBreak],
          NO_DATA_COLOR,
          colorExpression,
        ]
      }
    }

    if (resolvedRange?.outOfRangeMode === 'gray') {
      colorExpression = [
        'case',
        ['==', ['get', 'inCustomRange'], false],
        NO_DATA_COLOR,
        colorExpression,
      ]
    }

    // Store base expression for live noDataColor updates (before the outermost hasData wrap)
    ChoroplethRenderer.expressionCache.set(this.map, colorExpression as unknown[])

    colorExpression = [
      'case',
      ['==', ['get', 'hasData'], false],
      settings.noDataColor ?? NO_DATA_COLOR,
      colorExpression,
    ]

    // Render to map
    this.renderToMap(allFeaturesGeoJSON, colorExpression, settings, resolvedRange, locationLevel)
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
    domain?: { min: number; max: number },
  ): unknown[] {
    const min = domain?.min ?? Math.min(...domainValues)
    const max = domain?.max ?? Math.max(...domainValues)
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
          if (isNaN(value)) return
          dataMap[compositeKey] = value

          // Also store plate-code-based key (e.g. "27_sehitkamil")
          const plateCode = getPlateCodeByName(provinceName)
          if (plateCode) {
            dataMap[`${plateCode}_${normalizedKey}`] = value
          }
        } else {
          const value = parseFloat(String(d[dataColumn]))
          if (!isNaN(value)) dataMap[normalizedKey] = value
        }
      }
    })

    return dataMap
  }

  /**
     * Process GeoJSON features — assigns dataValue and hasData only (no color)
     */
  private processFeatures(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    locationLevel: 'province' | 'district',
    resolvedRange: ResolvedCustomRange | null,
  ): { allFeatures: GeoJSONFeature[]; featuresWithData: GeoJSONFeature[] } {
    const allFeatures: GeoJSONFeature[] = []
    const featuresWithData: GeoJSONFeature[] = []

    features.forEach((feature) => {
      const featureName = this.getFeatureName(feature, locationLevel)

      // Provinces: normalize display name via plate code so aliases like "Afyon" → "Afyonkarahisar"
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
      const dataValue = this.getDataValue(feature, dataMap, normalizedFeatureName, locationLevel)

      const enriched: GeoJSONFeature = {
        ...feature,
        properties: {
          ...feature.properties,
          displayName,
          name: displayName,
          value: dataValue ?? 0,
          dataValue: dataValue ?? 0,
          hasData: dataValue !== undefined,
          inCustomRange: dataValue !== undefined ? isValueInCustomRange(dataValue, resolvedRange) : false,
        },
      }

      allFeatures.push(enriched)
      if (dataValue !== undefined) featuresWithData.push(enriched)
    })

    return { allFeatures, featuresWithData }
  }

  /**
     * Get feature name based on location level
     */
  private getFeatureName(feature: GeoJSONFeature, locationLevel: 'province' | 'district'): string {
    const props = feature.properties

    if (locationLevel === 'province') {
      return String(props.ADI || props.ILAD || props.name || props.NAME || props.IL_ADI || 'Bilinmiyor')
    } else {
      return String(props.ILCEAD || props.ILCE_ADI || props.name || props.NAME || 'Bilinmiyor')
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
     * Render processed GeoJSON to map with data-driven color expression
     */
  private renderToMap(
    geojson: GeoJSONFeatureCollection,
    colorExpression: unknown[],
    settings: VisualizationSettings,
    resolvedRange: ResolvedCustomRange | null,
    locationLevel: 'province' | 'district' = 'province',
  ): void {
    const sourceId = 'choropleth-source'
    const choroplethOpacity = settings.choroplethOpacity ?? 1
    const fillOpacity: unknown = settings.dataOnlyMode && settings.dataOnlyStyle === 'transparent'
      ? ['case', ['==', ['get', 'hasData'], false], 0, choroplethOpacity]
      : choroplethOpacity
    let layerFilter: NonNullable<Parameters<Map['setFilter']>[1]>
    if (settings.dataOnlyMode && settings.dataOnlyStyle === 'hidden') {
      layerFilter = ['==', ['get', 'hasData'], true]
    } else if (resolvedRange?.outOfRangeMode === 'transparent') {
      layerFilter = ['any', ['==', ['get', 'hasData'], false], ['==', ['get', 'inCustomRange'], true]]
    } else {
      layerFilter = ['any', ['==', ['get', 'hasData'], true], ['==', ['get', 'hasData'], false]]
    }

    // Convert to MapLibre-compatible GeoJSON
    const safeGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: geojson.features.map(f => {
        const props = f.properties
        // Ensure properties is a valid object (not null)
        const safeProps: Record<string, unknown> =
          props && typeof props === 'object' && !Array.isArray(props) && props !== null
            ? props as Record<string, unknown>
            : {}
        return {
          type: 'Feature' as const,
          properties: safeProps,
          geometry: f.geometry as GeoJSON.Geometry,
        }
      }),
    }

    // Add or update source
    if (this.map.getSource(sourceId)) {
      const source = this.map.getSource(sourceId) as GeoJSONSource
      if (source && source.type === 'geojson') {
        source.setData(safeGeoJSON)
      }
    } else {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: safeGeoJSON,
      })
    }

    // Add fill layer (only features with data)
    if (!this.map.getLayer('choropleth-fill')) {
      this.map.addLayer({
        id: 'choropleth-fill',
        type: 'fill',
        source: sourceId,
        filter: layerFilter,
        paint: {
          'fill-color': colorExpression as Parameters<Map['setPaintProperty']>[2],
          'fill-opacity': fillOpacity as Parameters<Map['setPaintProperty']>[2],
        },
      })
    } else {
      this.map.setFilter('choropleth-fill', layerFilter)
      this.map.setPaintProperty('choropleth-fill', 'fill-color', colorExpression)
      this.map.setPaintProperty('choropleth-fill', 'fill-opacity', fillOpacity)
    }

    // Add outline layer (only features with data)
    if (!this.map.getLayer('choropleth-outline')) {
      this.map.addLayer({
        id: 'choropleth-outline',
        type: 'line',
        source: sourceId,
        filter: layerFilter,
        paint: {
          'line-color': '#6b7280',
          'line-width': 1,
          'line-opacity': 0.8,
        },
      })
    } else {
      this.map.setFilter('choropleth-outline', layerFilter)
      this.map.setPaintProperty('choropleth-outline', 'line-color', '#6b7280')
      this.map.setPaintProperty('choropleth-outline', 'line-width', 1)
      this.map.setPaintProperty('choropleth-outline', 'line-opacity', 0.8)
    }

    const labelPoints = this.buildLabelPoints(geojson.features, locationLevel, settings.valueLabelFormat ?? '1,000.0')
    this.renderLabelLayers(settings, labelPoints)
  }

  /**
   * Build deduplicated centroid Point GeoJSON for label layers.
   * Features are already enriched (displayName, hasData, dataValue).
   * İlçe seviyesinde aynı isimli ilçeler farklı iller altında olabilir;
   * dedup anahtarı il__ilçe bileşiği ile oluşturulur.
   */
  private buildLabelPoints(
    features: GeoJSONFeature[],
    locationLevel: 'province' | 'district' = 'province',
    valueLabelFormat: NumberFormat = '1,000.0',
  ): GeoJSON.FeatureCollection {
    const seen = new Set<string>()
    const pointFeatures: GeoJSON.Feature[] = []

    features.forEach((feature) => {
      const geometry = feature.geometry
      if (!isPolygonOrMultiPolygon(geometry)) return

      const displayName = String(feature.properties.displayName || '')
      if (!displayName) return

      const provinceHint = locationLevel === 'district'
        ? String(feature.properties.ADI || feature.properties.ILAD || feature.properties.IL_ADI || feature.properties.il_adi || '')
        : ''
      const dedupKey = provinceHint ? `${provinceHint}__${displayName}` : displayName
      if (seen.has(dedupKey)) return
      seen.add(dedupKey)

      const centroid = calculateCentroid(geometry)
      const dataVal = feature.properties.dataValue ?? 0
      const hasData = feature.properties.hasData ?? false
      pointFeatures.push({
        type: 'Feature',
        properties: {
          displayName,
          dataValue: dataVal,
          formattedValue: hasData ? formatNumber(dataVal, valueLabelFormat) : '',
          hasData,
          inCustomRange: feature.properties.inCustomRange ?? true,
        },
        geometry: { type: 'Point', coordinates: centroid },
      })
    })

    return { type: 'FeatureCollection', features: pointFeatures }
  }

  private renderLabelLayers(settings: VisualizationSettings, labelPoints: GeoJSON.FeatureCollection): void {
    if (this.map.getSource('viz-label-source')) {
      (this.map.getSource('viz-label-source') as GeoJSONSource).setData(labelPoints)
    } else {
      this.map.addSource('viz-label-source', { type: 'geojson', data: labelPoints })
    }
    applyLabelLayers(this.map, 'viz-label-source', settings)
  }
}
