import shp from 'shpjs'

import { parseGeoJSON } from './geoJsonProcessor'
import type { NewDataItem } from '../../types'

export async function parseShapefile(buffer: ArrayBuffer, fileName: string): Promise<NewDataItem[]> {
  const geojson = await shp(buffer)
  let items: NewDataItem[] = []

  if (Array.isArray(geojson)) {
    geojson.forEach((sourceGeoJson) => {
      const safeGeoJSON = {
        ...sourceGeoJson,
        features: sourceGeoJson.features?.map(feature => ({
          ...feature,
          geometry: feature.geometry || undefined,
        })) || [],
      }
      items = [...items, ...parseGeoJSON(safeGeoJSON as unknown as Parameters<typeof parseGeoJSON>[0], fileName)]
    })
  } else {
    const safeGeoJSON = {
      ...geojson,
      features: geojson.features?.map(feature => ({
        ...feature,
        geometry: feature.geometry || undefined,
      })) || [],
    }
    items = parseGeoJSON(safeGeoJSON as unknown as Parameters<typeof parseGeoJSON>[0], fileName)
  }

  return items
}

