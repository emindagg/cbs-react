import type { Feature, FeatureCollection, Geometry } from 'geojson'
import shpwrite from '@mapbox/shp-write'

import { toFeatureCollection } from './featureCollection'
import type { DataItem } from '../../types'

/** DBF alanları için düz değerler (iç içe nesneler stringe çevrilir). */
function sanitizeProperties(
  props: Record<string, unknown> | null | undefined,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!props) return out
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) {
      out[key] = ''
      continue
    }
    const t = typeof value
    if (t === 'string' || t === 'number' || t === 'boolean') {
      out[key] = value as string | number | boolean
      continue
    }
    out[key] = JSON.stringify(value)
  }
  return out
}

/**
 * @mapbox/shp-write MultiLineString / MultiPolygon destekler.
 * MultiPoint ve GeometryCollection burada sadeleştirilir.
 */
function flattenForShapefile(fc: FeatureCollection): FeatureCollection {
  const features: Feature<Geometry>[] = []

  const pushFlattened = (f: Feature<Geometry>): void => {
    const g = f.geometry
    if (!g) return

    const base = sanitizeProperties(f.properties as Record<string, unknown>)

    switch (g.type) {
      case 'Point':
      case 'LineString':
      case 'Polygon':
      case 'MultiLineString':
      case 'MultiPolygon':
        features.push({
          type: 'Feature',
          geometry: g,
          properties: base,
        })
        return
      case 'MultiPoint':
        g.coordinates.forEach((coord, index) => {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coord },
            properties: { ...base, shpPart: index + 1 },
          })
        })
        return
      case 'GeometryCollection':
        for (const sub of g.geometries) {
          pushFlattened({
            type: 'Feature',
            geometry: sub,
            properties: f.properties as Record<string, unknown>,
          } as Feature<Geometry>)
        }
        return
      default:
        return
    }
  }

  for (const f of fc.features) {
    if (!f.geometry) continue
    pushFlattened(f as Feature<Geometry>)
  }

  return { type: 'FeatureCollection', features }
}

export async function exportAsShapefileZip(items: DataItem[]): Promise<Blob> {
  const featureCollection = flattenForShapefile(toFeatureCollection(items))
  if (featureCollection.features.length === 0) {
    throw new Error(
      'Shapefile için uygun geometri yok (desteklenen: nokta, çizgi, alan ve bunların çoklu tipleri).',
    )
  }

  const bytes = await shpwrite.zip<'uint8array'>(featureCollection, {
    folder: 'layers',
    compression: 'STORE',
    outputType: 'uint8array',
  })

  return new Blob([bytes], {
    type: 'application/zip',
  })
}
