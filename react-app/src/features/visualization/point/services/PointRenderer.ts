import type { GeoJSONSource, Map } from 'maplibre-gl'

import type { GeoJSONFeature, GeoJSONFeatureCollection } from '@/types/geojson'
import type { VisualizationSettings } from '@/types/visualization'
import { isPolygonOrMultiPolygon } from '@/utils/geometryTypeGuards'
import { calculateBounds, calculateCentroid } from '@/utils/geometryUtils'
import { hashString, mulberry32 } from '@/utils/prng'
import { getPlateCodeByName, getProvinceByPlateCode, normalizeTurkishText } from '@/utils/turkishNormalizer'

import {
  isValueInCustomRange,
  resolveCustomRange,
  type ResolvedCustomRange,
} from '../../shared/customRange'
import { applyLabelLayers } from '../../shared/labelLayers'
import {
  DEFAULT_DOT_COLOR,
  DEFAULT_DOT_OPACITY,
  DEFAULT_DOT_SIZE,
  MAX_DOTS_PER_FEATURE,
  MAX_TOTAL_DOTS,
  MIN_DOTS_PER_FEATURE,
} from '../constants/dot-density'
import { buildZoomRadius, calculateSmartDotValue } from '../utils/dot-density'

// Dot rendering style constants
const DOT_STROKE_COLOR = 'rgba(255,255,255,0.6)'
const DOT_STROKE_WIDTH = 0.5
const OUT_OF_RANGE_COLOR = '#dddddd'
const BACKDROP_SOURCE_ID = 'viz-backdrop-source'
const BACKDROP_FILL_LAYER_ID = 'viz-backdrop-fill'
const BACKDROP_OUTLINE_LAYER_ID = 'viz-backdrop-outline'
const BACKDROP_FILL_COLOR = '#e4e4e4'
export const DEFAULT_BACKDROP_FILL_OPACITY = 1
const BACKDROP_LINE_COLOR = '#94a3b8'
const BACKDROP_LINE_OPACITY = 0.85
const BACKDROP_LINE_WIDTH = 0.8

type Coordinate = [number, number]
type Ring = Coordinate[]
type Polygon = Ring[]
type MultiPolygon = Polygon[]

interface PolygonRings {
  exterior: Ring
  holes: Ring[]
}

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
    const dotOpacity = settings.dotOpacity ?? DEFAULT_DOT_OPACITY
    const resolvedRange = resolveCustomRange(settings.customRange, values)

    console.debug(`🔵 Dot Density: dotValue=${dotValue}, dotSize=${dotSize}px, color=${dotColor}, features=${values.length}`)

    // 3. Build data map
    const dataMap = this.createDataMap(userData, dataColumn, locationLevel)

    // 4. Generate dot-density points
    const dotsGeoJSON = this.generateDots(
      geojson.features,
      dataMap,
      locationLevel,
      dotValue,
      resolvedRange,
    )

    console.debug(
      `📍 Dot density: ${userData.length} data rows → ${dotsGeoJSON.features.length} dots (1 dot = ${dotValue} units)`,
    )

    // Build label polygons for name/value label layers
    const labelPolygons = this.buildLabelPolygons(geojson.features, dataMap, locationLevel)

    // Build backdrop with hasData so dataOnlyMode case expression works correctly
    const backdropFeatures = geojson.features.map((feature) => {
      const featureName = this.getFeatureName(feature, locationLevel)
      const normalizedName = normalizeTurkishText(featureName)
      const dataValue = this.getDataValue(feature, dataMap, normalizedName, locationLevel)
      return {
        ...feature,
        properties: { ...(feature.properties ?? {}), hasData: dataValue !== undefined && dataValue !== 0 },
      } as GeoJSON.Feature
    })

    // 5. Render with single color (no classification needed)
    this.renderToMap(
      dotsGeoJSON,
      { type: 'FeatureCollection', features: backdropFeatures },
      labelPolygons,
      settings,
      dotColor,
      dotSize,
      dotOpacity,
      resolvedRange,
    )
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
  /*  DOT GENERATION                                                    */
  /* ------------------------------------------------------------------ */

  private generateDots(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    locationLevel: 'province' | 'district',
    dotValue: number,
    resolvedRange: ResolvedCustomRange | null,
  ): GeoJSON.FeatureCollection {
    const allDots: GeoJSON.Feature[] = []
    let totalPlaced = 0

    for (const feature of features) {
      if (totalPlaced >= MAX_TOTAL_DOTS) break

      // Geometry validation
      const geometry = feature.geometry
      if (!geometry || !isPolygonOrMultiPolygon(geometry)) {
        continue
      }

      const featureName = this.getFeatureName(feature, locationLevel)
      const normalizedName = normalizeTurkishText(featureName)
      const dataValue = this.getDataValue(feature, dataMap, normalizedName, locationLevel)

      if (dataValue === undefined || dataValue === 0) continue
      const inCustomRange = isValueInCustomRange(dataValue, resolvedRange)

      // How many dots for this feature?
      let dotCount = Math.round(Math.abs(dataValue) / dotValue)
      dotCount = Math.max(MIN_DOTS_PER_FEATURE, Math.min(dotCount, MAX_DOTS_PER_FEATURE))

      // Don't exceed global cap
      if (totalPlaced + dotCount > MAX_TOTAL_DOTS) {
        dotCount = MAX_TOTAL_DOTS - totalPlaced
      }

      // Get geometry rings for point-in-polygon test (with hole support)
      const bbox = calculateBounds(geometry)
      const polygonRings = this.extractRings(geometry)

      // Validate bbox (non-degenerate)
      const [minLng, minLat, maxLng, maxLat] = bbox
      if (maxLng - minLng === 0 || maxLat - minLat === 0) {
        console.warn(`⚠️  Degenerate bbox for feature "${featureName}", skipping`)
        continue
      }

      if (polygonRings.length === 0) continue

      // Scatter dots with seeded PRNG
      const dots = this.scatterDotsInPolygon(
        dotCount,
        bbox,
        polygonRings,
        featureName,
        dataValue,
        inCustomRange,
        locationLevel,
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
   * Scatter N dots inside a polygon using seeded PRNG (rejection sampling).
   * Same featureName → same seed → deterministic dot positions.
   */
  private scatterDotsInPolygon(
    count: number,
    bbox: [number, number, number, number],
    polygonRings: PolygonRings[],
    featureName: string,
    dataValue: number,
    inCustomRange: boolean,
    locationLevel: 'province' | 'district',
  ): GeoJSON.Feature[] {
    const [minLng, minLat, maxLng, maxLat] = bbox
    const dots: GeoJSON.Feature[] = []
    const maxAttempts = count * 20 // Avoid infinite loop
    let attempts = 0

    // Seeded PRNG: same feature name → same dot positions every render
    const rand = mulberry32(hashString(featureName))

    while (dots.length < count && attempts < maxAttempts) {
      attempts++

      // Random point in bbox (seeded)
      const lng = minLng + rand() * (maxLng - minLng)
      const lat = minLat + rand() * (maxLat - minLat)

      // Point-in-polygon test: inside exterior AND outside all holes
      if (this.pointInPolygonWithHoles([lng, lat], polygonRings)) {
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

        dots.push({
          type: 'Feature',
          properties: {
            displayName,
            name: displayName,
            value: dataValue,
            dataValue,
            hasData: true,
            inCustomRange,
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
   * Extract exterior + hole rings from a Polygon or MultiPolygon.
   * GeoJSON spec: coordinates[0] = exterior, coordinates[1..n] = holes
   */
  private extractRings(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): PolygonRings[] {
    if (geometry.type === 'Polygon') {
      const poly = geometry.coordinates as Polygon
      if (poly.length === 0 || !poly[0]) return []
      return [{
        exterior: poly[0],
        holes: poly.slice(1).filter(Boolean),
      }]
    } else if (geometry.type === 'MultiPolygon') {
      const multi = geometry.coordinates as MultiPolygon
      return multi
        .filter((poly) => poly.length > 0 && poly[0])
        .map((poly) => ({
          exterior: poly[0],
          holes: poly.slice(1).filter(Boolean),
        }))
    }
    return []
  }

  /**
   * Test if a point lies inside any polygon (exterior) and outside all holes.
   */
  private pointInPolygonWithHoles(point: Coordinate, polygonRings: PolygonRings[]): boolean {
    for (const { exterior, holes } of polygonRings) {
      if (this.pointInRing(point, exterior)) {
        // Check it's not inside any hole
        const inHole = holes.some((hole) => this.pointInRing(point, hole))
        if (!inHole) return true
      }
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
  /*  LABEL HELPERS                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Build enriched polygon GeoJSON for label layers (displayName, dataValue, hasData)
   */
  private buildLabelPolygons(
    features: GeoJSONFeature[],
    dataMap: Record<string, number>,
    locationLevel: 'province' | 'district',
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

      if (seen.has(displayName)) return
      seen.add(displayName)

      const normalizedFeatureName = normalizeTurkishText(featureName)
      const dataValue = this.getDataValue(feature, dataMap, normalizedFeatureName, locationLevel)
      const centroid = calculateCentroid(geometry)

      pointFeatures.push({
        type: 'Feature',
        properties: {
          displayName,
          dataValue: dataValue ?? 0,
          hasData: dataValue !== undefined,
        },
        geometry: { type: 'Point', coordinates: centroid },
      })
    })

    return { type: 'FeatureCollection', features: pointFeatures }
  }

  private renderLabelLayers(sourceId: string, settings: VisualizationSettings): void {
    applyLabelLayers(this.map, sourceId, settings)
  }

  /* ------------------------------------------------------------------ */
  /*  MAP RENDERING                                                     */
  /* ------------------------------------------------------------------ */

  private renderToMap(
    geojson: GeoJSON.FeatureCollection,
    backdropGeoJSON: GeoJSON.FeatureCollection,
    labelPolygonGeoJSON: GeoJSON.FeatureCollection,
    settings: VisualizationSettings,
    dotColor: string,
    dotSize: number,
    dotOpacity: number,
    resolvedRange: ResolvedCustomRange | null,
  ): void {
    const sourceId = 'dot-source'
    const layerId = 'dot-circles'
    const zoomRadius = buildZoomRadius(dotSize)
    const layerFilter: NonNullable<Parameters<Map['setFilter']>[1]> =
      resolvedRange?.outOfRangeMode === 'transparent'
        ? ['all', ['==', ['get', 'hasData'], true], ['==', ['get', 'inCustomRange'], true]]
        : ['==', ['get', 'hasData'], true]
    const circleColor: unknown =
      resolvedRange?.outOfRangeMode === 'gray'
        ? ['case', ['==', ['get', 'inCustomRange'], false], OUT_OF_RANGE_COLOR, dotColor]
        : dotColor
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

    // Add circle layer (single color, no classification)
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: layerFilter,
        paint: {
          'circle-radius': zoomRadius,
          'circle-color': circleColor as Parameters<Map['setPaintProperty']>[2],
          'circle-stroke-color': 'rgba(255,255,255,0.6)',
          'circle-stroke-width': 0.5,
          'circle-opacity': dotOpacity,
        },
      })
    } else {
      this.map.setFilter(layerId, layerFilter)
      this.map.setPaintProperty(layerId, 'circle-radius', zoomRadius)
      this.map.setPaintProperty(layerId, 'circle-color', circleColor as Parameters<Map['setPaintProperty']>[2])
      this.map.setPaintProperty(layerId, 'circle-stroke-color', DOT_STROKE_COLOR)
      this.map.setPaintProperty(layerId, 'circle-stroke-width', DOT_STROKE_WIDTH)
      this.map.setPaintProperty(layerId, 'circle-opacity', dotOpacity)
    }

    this.renderLabelLayers('viz-label-source', settings)
  }
}
