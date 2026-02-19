import type { Feature, FeatureCollection, Geometry } from 'geojson'

import type { DataItem } from '../../types'

export function toFeatureCollection(items: DataItem[]): FeatureCollection {
  const features: Feature<Geometry>[] = items.map(item => ({
    type: 'Feature',
    id: item.id,
    geometry: item.geometry,
    properties: {
      ...item.properties,
      name: item.name,
      date: item.date ?? '',
      type: item.type,
      visible: item.visible,
    },
  }))

  return {
    type: 'FeatureCollection',
    features,
  }
}

