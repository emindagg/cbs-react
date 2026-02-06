/**
 * Bubble Renderer
 * Handles bubble map rendering with variable-size circles
 */

import type { GeoJSONSource, Map } from 'maplibre-gl'

import { getColorForValue, getColorPalette, getContinuousColorForValue } from '../../constants/colorSchemes'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../../types/geojson'
import type { VisualizationSettings } from '../../types/visualization'
import { calculateBreaks } from '../../utils/classificationMethods'
import { calculateCentroid } from '../../utils/geometryUtils'
import { calculateSymbolSize } from '../../utils/symbolShapes'
import { normalizeTurkishText } from '../../utils/turkishNormalizer'

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
    const breaks = calculateBreaks(values, settings.classificationMethod, settings.classCount, settings.customBreaks)
    const colorPalette = getColorPalette(settings.colorScheme, settings.classCount)
    const isContinuous = settings.legendType === 'continuous'

    // Find min/max for size scaling
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)

    // Create data map
    const dataMap = this.createDataMap(userData, dataColumn, locationLevel)

    // Process features and convert to bubbles
    const bubblesGeoJSON = this.processFeatures(
      geojson.features,
      dataMap,
      breaks,
      colorPalette,
      minValue,
      maxValue,
      locationLevel,
      settings,
      values,
      isContinuous,
    )

    console.debug(
      `⚫ Bubble visualization: ${userData.length} data → ${bubblesGeoJSON.features.length} bubbles on map`,
    )

    // Render to map
    this.renderToMap(bubblesGeoJSON, settings)
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
   * Process GeoJSON features and convert to bubble features
   */
  private processFeatures(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    breaks: number[],
    colorPalette: string[],
    minValue: number,
    maxValue: number,
    locationLevel: 'province' | 'district',
    settings: VisualizationSettings,
    allValues: number[],
    isContinuous: boolean,
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

      // Create bubble feature
      const bubbleFeature = this.createBubbleFeature(
        feature,
        featureName,
        dataValue,
        breaks,
        colorPalette,
        minValue,
        maxValue,
        centroid,
        settings,
        allValues,
        isContinuous,
      )

      bubbleFeatures.push(bubbleFeature)
    })

    return {
      type: 'FeatureCollection',
      features: bubbleFeatures,
    }
  }

  /**
   * Create a bubble feature from a polygon feature
   */
  private createBubbleFeature(
    _originalFeature: GeoJSONFeature,
    featureName: string,
    dataValue: number | undefined,
    breaks: number[],
    colorPalette: string[],
    minValue: number,
    maxValue: number,
    centroid: [number, number],
    settings: VisualizationSettings,
    allValues: number[],
    isContinuous: boolean,
  ): GeoJSON.Feature {
    let color: string
    let radius: number
    let hasData: boolean

    if (dataValue !== undefined && dataValue !== 0) {
      // Choose color based on mode: continuous or steps
      if (isContinuous) {
        color = getContinuousColorForValue(dataValue, allValues, settings.colorScheme)
      } else {
        color = getColorForValue(dataValue, breaks, colorPalette)
      }
      radius = this.calculateSymbolSizeValue(dataValue, minValue, maxValue, settings)
      hasData = true
    } else {
      // Should not reach here since we filter in processFeatures
      return {
        type: 'Feature',
        properties: { displayName: featureName, name: featureName, value: 0, dataValue: 0, color: 'transparent', radius: 0, hasData: false },
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
        radius,
        hasData,
      },
      geometry: {
        type: 'Point',
        coordinates: centroid,
      },
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
   * Render processed bubble GeoJSON to map
   */
  private renderToMap(geojson: GeoJSON.FeatureCollection, settings: VisualizationSettings): void {
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

    // Add circle layer with variable size and customizable styling
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: ['==', ['get', 'hasData'], true],
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': opacity,
          'circle-stroke-color': strokeColor,
          'circle-stroke-width': strokeWidth,
        },
      })
    } else {
      this.map.setFilter(layerId, ['==', ['get', 'hasData'], true])
      this.map.setPaintProperty(layerId, 'circle-radius', ['get', 'radius'])
      this.map.setPaintProperty(layerId, 'circle-color', ['get', 'color'])
      this.map.setPaintProperty(layerId, 'circle-opacity', opacity)
      this.map.setPaintProperty(layerId, 'circle-stroke-color', strokeColor)
      this.map.setPaintProperty(layerId, 'circle-stroke-width', strokeWidth)
    }
  }
}
