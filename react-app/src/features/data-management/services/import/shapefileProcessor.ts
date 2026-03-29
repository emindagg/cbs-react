import type { FeatureCollection } from 'geojson'
import shp from 'shpjs'

import {
  applyShapefilePrjToWgs84IfNeeded,
  readPrjWktFromShapefileZip,
} from '@/utils/shapefileProjection'

import { parseGeoJSON } from './geoJsonProcessor'
import type { NewDataItem } from '../../types'

function normalizeShapefileGeoJSON(
  source: FeatureCollection,
  buffer: ArrayBuffer,
): Parameters<typeof parseGeoJSON>[0] {
  const prjWkt = readPrjWktFromShapefileZip(buffer)
  const base: FeatureCollection = {
    type: 'FeatureCollection',
    ...(source.bbox !== undefined ? { bbox: source.bbox } : {}),
    features: (source.features ?? []).map(feature => ({
      ...feature,
      geometry: feature.geometry ?? undefined,
    })),
  }
  const reprojected = applyShapefilePrjToWgs84IfNeeded(base, prjWkt)
  return {
    ...source,
    ...reprojected,
  } as Parameters<typeof parseGeoJSON>[0]
}

export async function parseShapefile(buffer: ArrayBuffer, fileName: string): Promise<NewDataItem[]> {
  const geojson = await shp(buffer)
  let items: NewDataItem[] = []

  if (Array.isArray(geojson)) {
    geojson.forEach((sourceGeoJson) => {
      const safeGeoJSON = normalizeShapefileGeoJSON(sourceGeoJson, buffer)
      items = [...items, ...parseGeoJSON(safeGeoJSON, fileName)]
    })
  } else {
    const safeGeoJSON = normalizeShapefileGeoJSON(geojson, buffer)
    items = parseGeoJSON(safeGeoJSON, fileName)
  }

  return items
}

