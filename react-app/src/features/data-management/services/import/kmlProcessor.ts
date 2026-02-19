import * as toGeoJSON from '@tmcw/togeojson'

import { parseGeoJSON } from './geoJsonProcessor'
import type { NewDataItem } from '../../types'

export async function parseKML(text: string, fileName: string): Promise<NewDataItem[]> {
  const parser = new DOMParser()
  const kml = parser.parseFromString(text, 'text/xml')
  const geojson = toGeoJSON.kml(kml)
  const safeGeoJSON = {
    ...geojson,
    features: geojson.features?.map(feature => ({
      ...feature,
      geometry: feature.geometry || undefined,
    })) || [],
  }

  return parseGeoJSON(safeGeoJSON as unknown as Parameters<typeof parseGeoJSON>[0], fileName)
}

