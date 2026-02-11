/**
 * Point Renderer — ArcGIS-style Dot Density
 *
 * Each dot represents a fixed quantity (dot value).
 * Dots are randomly scattered inside each polygon's bounding box,
 * filtered by a simple point-in-polygon test.
 *
 * Key concepts (ArcGIS):
 *  - dotValue   : how many units a single dot represents
 *  - dotCount   : Math.round(featureValue / dotValue)
 *  - Dots vary by map scale (optional, not implemented yet)
 *
 * Uses MapLibre data-driven styling (GPU-side color rendering)
 */

import type { GeoJSONSource, Map } from 'maplibre-gl'

import {
  DEFAULT_DOT_COLOR,
  DEFAULT_DOT_SIZE,
  MAX_DOTS_PER_FEATURE,
  MAX_TOTAL_DOTS,
  MIN_DOTS_PER_FEATURE,
} from '../../features/viz-wizard/constants/dot-density'
import { calculateSmartDotValue } from '../../features/viz-wizard/utils/dot-density'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../../types/geojson'
import type { VisualizationSettings } from '../../types/visualization'
import { calculateBounds } from '../../utils/geometryUtils'
import { getPlateCodeByName, normalizeTurkishText } from '../../utils/turkishNormalizer'

type Coordinate = [number, number]
type Ring = Coordinate[]
type Polygon = Ring[]
type MultiPolygon = Polygon[]

/* Sabitler artık features/viz-wizard/constants/dot-density.ts'den geliyor */

export class PointRenderer {
  private map: Map

  constructor(map: Map) {
    this.map = map
  }

  /* ------------------------------------------------------------------ */
  /*  PUBLIC                                                             */
  /* ------------------------------------------------------------------ */

  async render(
    geojson: GeoJSONFeatureCollection,
    userData: Record<string, unknown>[],
    dataColumn: string,
    settings: VisualizationSettings,
    locationLevel: 'province' | 'district' = 'province',
  ): Promise<void> {
    // 1. Extract numeric values
    const values = userData
      .map((d) => parseFloat(String(d[dataColumn])))
      .filter((v) => !isNaN(v) && v !== 0)

    if (values.length === 0) {
      console.warn('⚠️  No valid data for dot-density visualization')
      return
    }

    // 2. Calculate dot value: prefer user setting, fallback to smart auto (shared algorithm)
    const dotValue = settings.dotValue ?? calculateSmartDotValue(values)
    const dotSize = settings.dotSize ?? DEFAULT_DOT_SIZE
    const dotColor = settings.dotColor ?? DEFAULT_DOT_COLOR

    console.debug(`🔵 Dot Density: dotValue=${dotValue}, dotSize=${dotSize}px, color=${dotColor}, features=${values.length}`)

    // 3. Build data map
    const dataMap = this.createDataMap(userData, dataColumn, locationLevel)

    // 4. Generate dot-density points
    const dotsGeoJSON = this.generateDots(
      geojson.features,
      dataMap,
      locationLevel,
      dotValue,
    )

    console.debug(
      `📍 Dot density: ${userData.length} data rows → ${dotsGeoJSON.features.length} dots (1 dot = ${dotValue} units)`,
    )

    // 5. Render with single color (no classification needed)
    this.renderToMap(dotsGeoJSON, dotColor, dotSize)
  }

  /* ------------------------------------------------------------------ */
  /*  DATA MAP                                                          */
  /* ------------------------------------------------------------------ */

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

        if (locationLevel === 'district' && d._province) {
          const provinceName = String(d._province)
          const provinceNormalized = normalizeTurkishText(provinceName)
          const compositeKey = `${provinceNormalized}_${normalizedKey}`
          const value = parseFloat(String(d[dataColumn]))
          dataMap[compositeKey] = value

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

  /* ------------------------------------------------------------------ */
  /*  DOT GENERATION (ArcGIS-style)                                     */
  /* ------------------------------------------------------------------ */

  private generateDots(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    locationLevel: 'province' | 'district',
    dotValue: number,
  ): GeoJSON.FeatureCollection {
    const allDots: GeoJSON.Feature[] = []
    let totalPlaced = 0

    for (const feature of features) {
      if (totalPlaced >= MAX_TOTAL_DOTS) break

      const featureName = this.getFeatureName(feature, locationLevel)
      const normalizedName = normalizeTurkishText(featureName)
      const dataValue = this.getDataValue(feature, dataMap, normalizedName, locationLevel)

      if (dataValue === undefined || dataValue === 0) continue

      // How many dots for this feature?
      let dotCount = Math.round(Math.abs(dataValue) / dotValue)
      dotCount = Math.max(MIN_DOTS_PER_FEATURE, Math.min(dotCount, MAX_DOTS_PER_FEATURE))

      // Don't exceed global cap
      if (totalPlaced + dotCount > MAX_TOTAL_DOTS) {
        dotCount = MAX_TOTAL_DOTS - totalPlaced
      }

      // Get geometry rings for point-in-polygon test
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const geometry = feature.geometry as any
      const bbox = calculateBounds(geometry)
      const rings = this.extractRings(geometry)

      // Scatter dots
      const dots = this.scatterDotsInPolygon(
        dotCount,
        bbox,
        rings,
        featureName,
        dataValue,
      )

      allDots.push(...dots)
      totalPlaced += dots.length
    }

    return {
      type: 'FeatureCollection',
      features: allDots,
    }
  }

  /**
   * Scatter N dots randomly inside a polygon (rejection sampling)
   */
  private scatterDotsInPolygon(
    count: number,
    bbox: [number, number, number, number],
    rings: Ring[],
    featureName: string,
    dataValue: number,
  ): GeoJSON.Feature[] {
    const [minLng, minLat, maxLng, maxLat] = bbox
    const dots: GeoJSON.Feature[] = []
    const maxAttempts = count * 20 // Avoid infinite loop
    let attempts = 0

    while (dots.length < count && attempts < maxAttempts) {
      attempts++

      // Random point in bbox
      const lng = minLng + Math.random() * (maxLng - minLng)
      const lat = minLat + Math.random() * (maxLat - minLat)

      // Point-in-polygon test (any ring)
      if (this.pointInAnyRing([lng, lat], rings)) {
        dots.push({
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
            coordinates: [lng, lat],
          },
        })
      }
    }

    return dots
  }

  /* ------------------------------------------------------------------ */
  /*  GEOMETRY HELPERS                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Extract all exterior rings from a Polygon or MultiPolygon
   */
  private extractRings(geometry: { type: string; coordinates: Polygon | MultiPolygon }): Ring[] {
    if (geometry.type === 'Polygon') {
      const poly = geometry.coordinates as Polygon
      return poly.length > 0 ? [poly[0]] : []
    } else if (geometry.type === 'MultiPolygon') {
      const multi = geometry.coordinates as MultiPolygon
      return multi.map((poly) => poly[0]).filter(Boolean)
    }
    return []
  }

  /**
   * Test if a point lies inside any of the given rings (ray-casting)
   */
  private pointInAnyRing(point: Coordinate, rings: Ring[]): boolean {
    for (const ring of rings) {
      if (this.pointInRing(point, ring)) return true
    }
    return false
  }

  /**
   * Ray-casting point-in-polygon for one ring
   */
  private pointInRing(point: Coordinate, ring: Ring): boolean {
    const [x, y] = point
    let inside = false

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1]
      const xj = ring[j][0], yj = ring[j][1]

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi)

      if (intersect) inside = !inside
    }

    return inside
  }

  /* ------------------------------------------------------------------ */
  /*  FEATURE NAME / DATA VALUE LOOKUP                                  */
  /* ------------------------------------------------------------------ */

  private getFeatureName(feature: GeoJSONFeature, locationLevel: 'province' | 'district'): string {
    const props = feature.properties

    if (locationLevel === 'province') {
      return props.ADI || props.ILAD || props.name || props.NAME || props.IL_ADI || 'Bilinmiyor'
    } else {
      return props.ILCEAD || props.ILCE_ADI || props.name || props.NAME || 'Bilinmiyor'
    }
  }

  private getDataValue(
    feature: GeoJSONFeature,
    dataMap: Record<string, number>,
    normalizedFeatureName: string,
    locationLevel: 'province' | 'district',
  ): number | undefined {
    if (locationLevel === 'district') {
      const props = feature.properties

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

      if (props.plaka !== undefined && props.plaka !== null) {
        const plakaKey = `${String(props.plaka).trim()}_${normalizedFeatureName}`
        if (dataMap[plakaKey] !== undefined) return dataMap[plakaKey]
      }
    }

    if (dataMap[normalizedFeatureName] !== undefined) {
      return dataMap[normalizedFeatureName]
    }

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

  /* ------------------------------------------------------------------ */
  /*  MAP RENDERING                                                     */
  /* ------------------------------------------------------------------ */

  private renderToMap(geojson: GeoJSON.FeatureCollection, dotColor: string, dotSize: number): void {
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

    // Add circle layer (single color, no classification)
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: ['==', ['get', 'hasData'], true],
        paint: {
          'circle-radius': dotSize,
          'circle-color': dotColor,
          'circle-stroke-color': 'rgba(255,255,255,0.6)',
          'circle-stroke-width': 0.5,
          'circle-opacity': 0.85,
        },
      })
    } else {
      this.map.setFilter(layerId, ['==', ['get', 'hasData'], true])
      this.map.setPaintProperty(layerId, 'circle-radius', dotSize)
      this.map.setPaintProperty(layerId, 'circle-color', dotColor)
      this.map.setPaintProperty(layerId, 'circle-stroke-color', 'rgba(255,255,255,0.6)')
      this.map.setPaintProperty(layerId, 'circle-stroke-width', 0.5)
      this.map.setPaintProperty(layerId, 'circle-opacity', 0.85)
    }
  }
}
