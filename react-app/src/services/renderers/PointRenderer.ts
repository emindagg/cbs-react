/**
 * Point Renderer
 * Handles dot/point map rendering with fixed-size circles
 */

import type { GeoJSONSource, Map } from 'maplibre-gl'

import { getColorForValue, getColorPalette } from '../../constants/colorSchemes'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../../types/geojson'
import type { VisualizationSettings } from '../../types/visualization'
import { calculateBreaks } from '../../utils/classificationMethods'
import { calculateCentroid } from '../../utils/geometryUtils'
import { normalizeTurkishText } from '../../utils/turkishNormalizer'

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
    const breaks = calculateBreaks(values, settings.classificationMethod, settings.classCount, settings.customBreaks)
    const colorPalette = getColorPalette(settings.colorScheme, settings.classCount)

    // Create data map
    const dataMap = this.createDataMap(userData, dataColumn, locationLevel)

    // Process features and convert to points
    const pointsGeoJSON = this.processFeatures(geojson.features, dataMap, breaks, colorPalette, locationLevel)

    console.debug(
      `📍 Point visualization: ${userData.length} data → ${pointsGeoJSON.features.length} points on map`,
    )

    // Render to map
    this.renderToMap(pointsGeoJSON)
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
   * Process GeoJSON features and convert to point features
   */
  private processFeatures(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    breaks: number[],
    colorPalette: string[],
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

      // Create point feature
      const pointFeature = this.createPointFeature(feature, featureName, dataValue, breaks, colorPalette, centroid)

      pointFeatures.push(pointFeature)
    })

    return {
      type: 'FeatureCollection',
      features: pointFeatures,
    }
  }

  /**
   * Create a point feature from a polygon feature
   */
  private createPointFeature(
    _originalFeature: GeoJSONFeature,
    featureName: string,
    dataValue: number | undefined,
    breaks: number[],
    colorPalette: string[],
    centroid: [number, number],
  ): GeoJSON.Feature {
    let color: string
    let hasData: boolean

    if (dataValue !== undefined && dataValue !== 0) {
      color = getColorForValue(dataValue, breaks, colorPalette)
      hasData = true
    } else {
      // Skip features without data - make invisible
      return {
        type: 'Feature',
        properties: { displayName: featureName, name: featureName, value: 0, dataValue: 0, color: 'transparent', hasData: false },
        geometry: { type: 'Point', coordinates: centroid },
      }
    }

    return {
      type: 'Feature',
      properties: {
        displayName: featureName,
        name: featureName,
        value: dataValue || 0,
        dataValue: dataValue || 0,
        color,
        hasData,
      },
      geometry: {
        type: 'Point',
        coordinates: centroid,
      },
    }
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
   * Render processed point GeoJSON to map
   */
  private renderToMap(geojson: GeoJSON.FeatureCollection): void {
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
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
        },
      })
    } else {
      this.map.setFilter(layerId, ['==', ['get', 'hasData'], true])
      this.map.setPaintProperty(layerId, 'circle-radius', PointRenderer.POINT_RADIUS)
      this.map.setPaintProperty(layerId, 'circle-color', ['get', 'color'])
      this.map.setPaintProperty(layerId, 'circle-stroke-color', '#ffffff')
      this.map.setPaintProperty(layerId, 'circle-stroke-width', 1)
    }
  }
}
