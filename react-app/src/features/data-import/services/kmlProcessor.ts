import * as toGeoJSON from '@tmcw/togeojson'

import { parseGeoJSON } from './geoJsonProcessor'
import type { GeoItem } from '../types'

/**
 * Process KML files
 */
export async function parseKML(text: string, fileName: string): Promise<GeoItem[]> {
  const parser = new DOMParser()
  const kml = parser.parseFromString(text, 'text/xml')
  const geojson = toGeoJSON.kml(kml)
  // Convert to compatible format - filter out null geometries
  const safeGeoJSON = {
    ...geojson,
    features: geojson.features?.map(f => ({
      ...f,
      geometry: f.geometry || undefined,
    })) || [],
  }
  return parseGeoJSON(safeGeoJSON as unknown as Parameters<typeof parseGeoJSON>[0], fileName)
}
