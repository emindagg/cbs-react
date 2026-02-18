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
import { normalizeValue } from '@/utils/interpolation'
import { buildInterpolateExpression, buildStepExpression } from '@/utils/mapExpressions'
import { getPlateCodeByName, normalizeTurkishText } from '@/utils/turkishNormalizer'

import {
  clampToCustomRange,
  isValueInCustomRange,
  resolveCustomRange,
  type ResolvedCustomRange,
} from '../../shared/customRange'

const NO_DATA_COLOR = '#e4e4e4'
const CONTINUOUS_STOPS = 16

export class ChoroplethRenderer {
  private map: Map

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
    // Extract values for classification
    const values = userData
      .map((d) => parseFloat(String(d[dataColumn])))
      .filter((v) => !isNaN(v) && v !== 0)

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
    const effectiveClassCount = isCustom ? breaks.length - 1 : settings.classCount
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
        settings,
        resolvedRange ? { min: resolvedRange.min, max: resolvedRange.max } : undefined,
      )
    } else {
      colorExpression = buildStepExpression('dataValue', breaks, colorPalette, NO_DATA_COLOR)
    }

    if (resolvedRange?.outOfRangeMode === 'gray') {
      colorExpression = [
        'case',
        ['==', ['get', 'inCustomRange'], false],
        NO_DATA_COLOR,
        colorExpression,
      ]
    }

    colorExpression = [
      'case',
      ['==', ['get', 'hasData'], false],
      NO_DATA_COLOR,
      colorExpression,
    ]

    // Render to map
    this.renderToMap(allFeaturesGeoJSON, colorExpression, settings, resolvedRange)
  }

  /**
   * Build continuous interpolate expression by sampling color stops from the Chroma scale
   */
  private buildContinuousExpression(
    values: number[],
    settings: VisualizationSettings,
    domain?: { min: number; max: number },
  ): unknown[] {
    const sorted = [...values].sort((a, b) => a - b)
    const min = domain?.min ?? sorted[0]
    const max = domain?.max ?? sorted[sorted.length - 1]
    if (max === min) {
      return ['literal', getContinuousColor(0.5, settings.colorScheme, 'lab')]
    }

    const interpolation = settings.interpolation ?? 'equidistant'
    const colorStops: [number, string][] = []

    for (let i = 0; i < CONTINUOUS_STOPS; i++) {
      const t = i / (CONTINUOUS_STOPS - 1)
      // Map t (0-1) back to data domain
      const dataVal = min + t * (max - min)
      // Normalize using the interpolation method (handles quantile/natural warping)
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
      const normalizedFeatureName = normalizeTurkishText(featureName)

      // Get data value
      const dataValue = this.getDataValue(feature, dataMap, normalizedFeatureName, locationLevel)

      // Set feature properties
      feature.properties.displayName = featureName
      feature.properties.name = featureName

      if (dataValue !== undefined && dataValue !== 0) {
        feature.properties.value = dataValue
        feature.properties.dataValue = dataValue
        feature.properties.hasData = true
        feature.properties.inCustomRange = isValueInCustomRange(dataValue, resolvedRange)
        featuresWithData.push(feature)
      } else {
        feature.properties.value = 0
        feature.properties.dataValue = 0
        feature.properties.hasData = false
        feature.properties.inCustomRange = false
      }

      allFeatures.push(feature)
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
     * Render processed GeoJSON to map with data-driven color expression
     */
  private renderToMap(
    geojson: GeoJSONFeatureCollection,
    colorExpression: unknown[],
    settings: VisualizationSettings,
    resolvedRange: ResolvedCustomRange | null,
  ): void {
    const sourceId = 'choropleth-source'
    const fillOpacity = settings.choroplethOpacity ?? 1
    const layerFilter: NonNullable<Parameters<Map['setFilter']>[1]> =
      resolvedRange?.outOfRangeMode === 'transparent'
        ? ['any', ['==', 'hasData', false], ['==', 'inCustomRange', true]]
        : ['any', ['==', 'hasData', true], ['==', 'hasData', false]]

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
          'fill-opacity': fillOpacity,
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
  }
}
