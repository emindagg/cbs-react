import shpwrite from '@mapbox/shp-write'

import { toFeatureCollection } from './featureCollection'
import type { DataItem } from '../../types'

export async function exportAsShapefileZip(items: DataItem[]): Promise<Blob> {
  const featureCollection = toFeatureCollection(items)
  const result = await shpwrite.zip<'uint8array'>(featureCollection, {
    folder: 'layers',
    compression: 'STORE',
    outputType: 'uint8array',
  })
  const copied = new Uint8Array(result.byteLength)
  copied.set(result)
  return new Blob([copied.buffer], { type: 'application/zip' })
}
