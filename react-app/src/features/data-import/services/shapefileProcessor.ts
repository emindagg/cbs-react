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
      items = [...items, ...parseGeoJSON(g, fileName)]
    })
  } else {
    items = parseGeoJSON(geojson, fileName)
  }

  return items
}
