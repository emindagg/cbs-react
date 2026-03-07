import type { Map, GeoJSONSource } from 'maplibre-gl'

const SOURCE_ID = 'isochrone-source'
const ORIGIN_SOURCE_ID = 'isochrone-origin-source'
const FILL_LAYER_ID = 'isochrone-fill'
const STROKE_LAYER_ID = 'isochrone-stroke'
const ORIGIN_LAYER_ID = 'isochrone-origin'

const TIME_COLORS: Record<number, string> = {
  300: '#06b6d4',
  600: '#22c55e',
  900: '#eab308',
  1800: '#f97316',
  2700: '#ef4444',
  3600: '#a855f7',
}

const DEFAULT_COLOR = '#3b82f6'

function buildColorExpression(): unknown {
  const args: unknown[] = ['match', ['get', 'value']]
  for (const [seconds, color] of Object.entries(TIME_COLORS)) {
    args.push(Number(seconds), color)
  }
  args.push(DEFAULT_COLOR)
  return args
}

/**
 * Convert ORS nested polygons into non-overlapping rings by punching
 * each inner polygon's exterior ring as a hole into the next outer polygon.
 *
 * ORS returns full nested polygons (each larger polygon contains all smaller ones).
 * After this transform:
 *   - 5dk  → full inner circle
 *   - 10dk → donut between 5dk and 10dk boundaries
 *   - 15dk → donut between 10dk and 15dk boundaries
 */
function toRings(fc: GeoJSON.FeatureCollection): GeoJSON.Feature[] {
  const polygons = fc.features.filter(
    (f): f is GeoJSON.Feature<GeoJSON.Polygon> => f.geometry.type === 'Polygon',
  )

  if (polygons.length <= 1) return fc.features

  // Sort ascending by value (smallest time = innermost polygon)
  polygons.sort(
    (a, b) => ((a.properties?.value as number) ?? 0) - ((b.properties?.value as number) ?? 0),
  )

  return polygons.map((feature, i) => {
    if (i === 0) return feature  // innermost — no hole

    const inner = polygons[i - 1]
    const outerExterior = feature.geometry.coordinates[0]
    // Interior rings of inner polygon are irrelevant; only its exterior matters as hole.
    // Hole winding must be CW; GeoJSON exterior rings are CCW → reverse to get CW.
    const hole = [...inner.geometry.coordinates[0]].reverse()

    return {
      ...feature,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [outerExterior, hole],
      },
    }
  })
}

export class IsochroneRenderer {
  private map: Map

  constructor(map: Map) {
    this.map = map
  }

  render(geojson: GeoJSON.FeatureCollection, origin: [number, number]): void {
    const ringFeatures = toRings(geojson)
    const source: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: ringFeatures }

    this.addOrUpdateSource(SOURCE_ID, source)
    this.addOrUpdateOriginSource(origin)
    this.ensureFillLayer()
    this.ensureStrokeLayer(geojson)  // strokes use original polygons (boundary lines only)
    this.ensureOriginLayer()
  }

  remove(): void {
    const layers = [FILL_LAYER_ID, STROKE_LAYER_ID, ORIGIN_LAYER_ID]
    for (const id of layers) {
      if (this.map.getLayer(id)) this.map.removeLayer(id)
    }
    const sources = [SOURCE_ID, ORIGIN_SOURCE_ID, `${SOURCE_ID}-stroke`]
    for (const id of sources) {
      if (this.map.getSource(id)) this.map.removeSource(id)
    }
  }

  private addOrUpdateSource(id: string, data: GeoJSON.FeatureCollection): void {
    const existing = this.map.getSource(id) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(data)
    } else {
      this.map.addSource(id, { type: 'geojson', data })
    }
  }

  private addOrUpdateOriginSource(origin: [number, number]): void {
    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: origin },
        properties: {},
      }],
    }
    const existing = this.map.getSource(ORIGIN_SOURCE_ID) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(fc)
    } else {
      this.map.addSource(ORIGIN_SOURCE_ID, { type: 'geojson', data: fc })
    }
  }

  private ensureFillLayer(): void {
    if (this.map.getLayer(FILL_LAYER_ID)) return
    this.map.addLayer({
      id: FILL_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': buildColorExpression() as Parameters<Map['setPaintProperty']>[2],
        'fill-opacity': 0.4,
      },
    })
  }

  // Stroke layer gets a separate source with the ORIGINAL (non-ring) polygons
  // so the boundary lines sit at each isochrone edge correctly.
  private ensureStrokeLayer(original: GeoJSON.FeatureCollection): void {
    const strokeSourceId = `${SOURCE_ID}-stroke`
    const existing = this.map.getSource(strokeSourceId) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(original)
    } else {
      this.map.addSource(strokeSourceId, { type: 'geojson', data: original })
    }

    if (!this.map.getLayer(STROKE_LAYER_ID)) {
      this.map.addLayer({
        id: STROKE_LAYER_ID,
        type: 'line',
        source: strokeSourceId,
        paint: {
          'line-color': buildColorExpression() as Parameters<Map['setPaintProperty']>[2],
          'line-width': 2,
          'line-opacity': 0.9,
        },
      })
    }
  }

  private ensureOriginLayer(): void {
    if (this.map.getLayer(ORIGIN_LAYER_ID)) return
    this.map.addLayer({
      id: ORIGIN_LAYER_ID,
      type: 'circle',
      source: ORIGIN_SOURCE_ID,
      paint: {
        'circle-radius': 8,
        'circle-color': '#ffffff',
        'circle-stroke-color': '#0ea5e9',
        'circle-stroke-width': 3,
      },
    })
  }
}
