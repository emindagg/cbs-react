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
  return parseGeoJSON(geojson, fileName)
}
