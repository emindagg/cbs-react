import { toFeatureCollection } from './featureCollection'
import type { DataItem } from '../../types'


export function exportAsGeoJSON(items: DataItem[]): Blob {
  const featureCollection = toFeatureCollection(items)
  return new Blob([JSON.stringify(featureCollection, null, 2)], {
    type: 'application/geo+json',
  })
}

