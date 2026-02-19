import type { DataItem } from '../../types'

import { toFeatureCollection } from './featureCollection'

export function exportAsGeoJSON(items: DataItem[]): Blob {
  const featureCollection = toFeatureCollection(items)
  return new Blob([JSON.stringify(featureCollection, null, 2)], {
    type: 'application/geo+json',
  })
}

