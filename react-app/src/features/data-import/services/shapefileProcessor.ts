import type { FeatureCollection } from 'geojson'
import shp from 'shpjs'

import {
  applyShapefilePrjToWgs84IfNeeded,
  readPrjWktFromShapefileZip,
} from '@/utils/shapefileProjection'

import { parseGeoJSON } from './geoJsonProcessor'
import type { GeoItem } from '../types'

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

/**
 * Process Shapefile (ZIP) files
 */
export async function parseShapefile(buffer: ArrayBuffer, fileName: string): Promise<GeoItem[]> {
  const geojson = await shp(buffer)
  let items: GeoItem[] = []

  if (Array.isArray(geojson)) {
    geojson.forEach(g => {
      const safeGeoJSON = normalizeShapefileGeoJSON(g, buffer)
      items = [...items, ...parseGeoJSON(safeGeoJSON, fileName)]
    })
  } else {
    const safeGeoJSON = normalizeShapefileGeoJSON(geojson, buffer)
    items = parseGeoJSON(safeGeoJSON, fileName)
  }

  return items
}
