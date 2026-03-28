import type { Feature, FeatureCollection, Geometry } from 'geojson'

import type { DataItem } from '../../types'

export function toFeatureCollection(items: DataItem[]): FeatureCollection {
  const features: Feature<Geometry>[] = items.map(item => ({
    type: 'Feature',
    geometry: item.geometry,
    properties: {
      ...item.properties,
      name: item.name,
      date: item.date ?? '',
      layerType: item.type,
    },
  }))

  return {
    type: 'FeatureCollection',
    features,
  }
}

