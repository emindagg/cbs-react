/**
 * Choropleth Renderer
 * Handles choropleth map rendering with classification and coloring
 */

import type { GeoJSONSource, Map } from 'maplibre-gl'

import { getColorForValue, getColorPalette } from '../../constants/colorSchemes'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../../types/geojson'
import type { VisualizationSettings } from '../../types/visualization'
import { calculateBreaks } from '../../utils/classificationMethods'
import { normalizeTurkishText } from '../../utils/turkishNormalizer'

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

    // Calculate breaks
    const breaks = calculateBreaks(values, settings.classificationMethod, settings.classCount, settings.customBreaks)
    const colorPalette = getColorPalette(settings.colorScheme, settings.classCount)

    // Create data map
    const dataMap = this.createDataMap(userData, dataColumn, locationLevel)

    // Process all features
    const { allFeatures, featuresWithData } = this.processFeatures(
      geojson.features,
      dataMap,
      breaks,
      colorPalette,
      locationLevel,
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

    // Render to map
    this.renderToMap(allFeaturesGeoJSON)
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
          dataMap[compositeKey] = parseFloat(String(d[dataColumn]))
        } else {
          dataMap[normalizedKey] = parseFloat(String(d[dataColumn]))
        }
      }
    })

    return dataMap
  }

  /**
     * Process GeoJSON features and apply data
     */
  private processFeatures(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    breaks: number[],
    colorPalette: string[],
    locationLevel: 'province' | 'district',
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
        feature.properties.color = getColorForValue(dataValue, breaks, colorPalette)
        feature.properties.hasData = true
        featuresWithData.push(feature)
      } else {
        feature.properties.value = 0
        feature.properties.dataValue = 0
        feature.properties.color = '#dddddd'
        feature.properties.hasData = false
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
      return props.ILAD || props.name || props.NAME || props.IL_ADI || 'Bilinmiyor'
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
      const featureProvinceName = props.ILAD || props.IL_ADI || props.il_adi || props.province

      if (featureProvinceName) {
        const provinceNormalized = normalizeTurkishText(String(featureProvinceName))
        const compositeKey = `${provinceNormalized}_${normalizedFeatureName}`
        return dataMap[compositeKey]
      }
    }

    return dataMap[normalizedFeatureName]
  }

  /**
     * Render processed GeoJSON to map
     */
  private renderToMap(geojson: GeoJSONFeatureCollection): void {
    const sourceId = 'choropleth-source'

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

    // Add fill layer
    if (!this.map.getLayer('choropleth-fill')) {
      this.map.addLayer({
        id: 'choropleth-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 1,
        },
      })
    } else {
      this.map.setPaintProperty('choropleth-fill', 'fill-color', ['get', 'color'])
      this.map.setPaintProperty('choropleth-fill', 'fill-opacity', 1)
    }

    // Add outline layer
    if (!this.map.getLayer('choropleth-outline')) {
      this.map.addLayer({
        id: 'choropleth-outline',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#6b7280',
          'line-width': 1,
          'line-opacity': 0.8,
        },
      })
    } else {
      this.map.setPaintProperty('choropleth-outline', 'line-color', '#6b7280')
      this.map.setPaintProperty('choropleth-outline', 'line-width', 1)
      this.map.setPaintProperty('choropleth-outline', 'line-opacity', 0.8)
    }
  }
}
