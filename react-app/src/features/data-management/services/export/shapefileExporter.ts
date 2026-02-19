import type { Feature, FeatureCollection, Geometry } from 'geojson'
import shpwrite from 'shp-write/shpwrite.js'

import type { DataItem } from '../../types'

import { toFeatureCollection } from './featureCollection'

function convertUnsupportedGeometries(featureCollection: FeatureCollection): FeatureCollection {
  const features: Feature<Geometry>[] = []

  featureCollection.features.forEach((feature) => {
    if (!feature.geometry) return

    if (feature.geometry.type === 'MultiPoint') {
      feature.geometry.coordinates.forEach((coord, index) => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coord },
          properties: {
            ...(feature.properties ?? {}),
            part: index + 1,
          },
        })
      })
      return
    }

    features.push(feature as Feature<Geometry>)
  })

  return {
    type: 'FeatureCollection',
    features,
  }
}

export function exportAsShapefileZip(items: DataItem[]): Blob {
  const featureCollection = convertUnsupportedGeometries(toFeatureCollection(items))
  const zipBuffer = shpwrite.zip(featureCollection)

  return new Blob([zipBuffer], {
    type: 'application/zip',
  })
}
