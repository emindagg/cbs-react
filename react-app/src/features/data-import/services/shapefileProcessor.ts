import shp from 'shpjs'

import { parseGeoJSON } from './geoJsonProcessor'
import type { GeoItem } from '../types'

/**
 * Process Shapefile (ZIP) files
 */
export async function parseShapefile(buffer: ArrayBuffer, fileName: string): Promise<GeoItem[]> {
  const geojson = await shp(buffer)
  let items: GeoItem[] = []

  if (Array.isArray(geojson)) {
    geojson.forEach(g => {
      const safeGeoJSON = {
        ...g,
        features: g.features?.map((f: { geometry: unknown; properties: unknown }) => ({
          ...f,
          geometry: f.geometry || undefined,
        })) || [],
      }
      items = [...items, ...parseGeoJSON(safeGeoJSON as unknown as Parameters<typeof parseGeoJSON>[0], fileName)]
    })
  } else {
    const safeGeoJSON = {
      ...geojson,
      features: geojson.features?.map((f: { geometry: unknown; properties: unknown }) => ({
        ...f,
        geometry: f.geometry || undefined,
      })) || [],
    }
    items = parseGeoJSON(safeGeoJSON as unknown as Parameters<typeof parseGeoJSON>[0], fileName)
  }

  return items
}
