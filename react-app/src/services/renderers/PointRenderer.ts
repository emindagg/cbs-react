/**
 * Point Renderer
 * Handles dot/point map rendering with fixed-size circles
 * Uses MapLibre data-driven styling (GPU-side color rendering)
 */

import type { GeoJSONSource, Map } from 'maplibre-gl'

import { getColorPalette } from '../../constants/colorSchemes'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../../types/geojson'
import type { VisualizationSettings } from '../../types/visualization'
import { calculateBreaks } from '../../utils/classification'
import { calculateCentroid } from '../../utils/geometryUtils'
import { buildStepExpression } from '../../utils/mapExpressions'
import { getPlateCodeByName, normalizeTurkishText } from '../../utils/turkishNormalizer'

export class PointRenderer {
  private map: Map
  private static readonly POINT_RADIUS = 7

  constructor(map: Map) {
    this.map = map
  }

  /**
   * Render point/dot map
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

    // Calculate breaks
    const isCustom = settings.classificationMethod === 'custom' && settings.customBreaks?.length
    const breaks = isCustom
      ? settings.customBreaks!
      : calculateBreaks(values, settings.classificationMethod, settings.classCount)
    const effectiveClassCount = isCustom ? breaks.length - 1 : settings.classCount
    const colorPalette = getColorPalette(settings.colorScheme, effectiveClassCount)

    // Create data map
    const dataMap = this.createDataMap(userData, dataColumn, locationLevel)

    // Process features and convert to points (no color assignment)
    const pointsGeoJSON = this.processFeatures(geojson.features, dataMap, locationLevel)

    console.debug(
      `📍 Point visualization: ${userData.length} data → ${pointsGeoJSON.features.length} points on map`,
    )

    // Build MapLibre color expression
    const colorExpression = buildStepExpression('dataValue', breaks, colorPalette, 'transparent')

    // Render to map
    this.renderToMap(pointsGeoJSON, colorExpression)
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
   * Process GeoJSON features and convert to point features (no color assignment)
   */
  private processFeatures(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    locationLevel: 'province' | 'district',
  ): GeoJSON.FeatureCollection {
    const pointFeatures: GeoJSON.Feature[] = []

    features.forEach((feature) => {
      const featureName = this.getFeatureName(feature, locationLevel)
      const normalizedFeatureName = normalizeTurkishText(featureName)

      // Get data value
      const dataValue = this.getDataValue(feature, dataMap, normalizedFeatureName, locationLevel)

      // Calculate centroid
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const centroid = calculateCentroid(feature.geometry as any)

      if (dataValue !== undefined && dataValue !== 0) {
        pointFeatures.push({
          type: 'Feature',
          properties: {
            displayName: featureName,
            name: featureName,
            value: dataValue,
            dataValue,
            hasData: true,
          },
          geometry: {
            type: 'Point',
            coordinates: centroid,
          },
        })
      } else {
        pointFeatures.push({
          type: 'Feature',
          properties: {
            displayName: featureName,
            name: featureName,
            value: 0,
            dataValue: 0,
            hasData: false,
          },
          geometry: {
            type: 'Point',
            coordinates: centroid,
          },
        })
      }
    })

    return {
      type: 'FeatureCollection',
      features: pointFeatures,
    }
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
   * Render processed point GeoJSON to map with data-driven color expression
   */
  private renderToMap(geojson: GeoJSON.FeatureCollection, colorExpression: unknown[]): void {
    const sourceId = 'dot-source'
    const layerId = 'dot-circles'

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

    // Add circle layer (only features with data)
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: ['==', ['get', 'hasData'], true],
        paint: {
          'circle-radius': PointRenderer.POINT_RADIUS,
          'circle-color': colorExpression as Parameters<Map['setPaintProperty']>[2],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
        },
      })
    } else {
      this.map.setFilter(layerId, ['==', ['get', 'hasData'], true])
      this.map.setPaintProperty(layerId, 'circle-radius', PointRenderer.POINT_RADIUS)
      this.map.setPaintProperty(layerId, 'circle-color', colorExpression)
      this.map.setPaintProperty(layerId, 'circle-stroke-color', '#ffffff')
      this.map.setPaintProperty(layerId, 'circle-stroke-width', 1)
    }
  }
}
