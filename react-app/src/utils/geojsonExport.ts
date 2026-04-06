import { rewindFeatureCollection } from '@placemarkio/geojson-rewind'
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'

import type { DataItem } from '@/features/data-management'

export interface GeoJSONExportOptions {
  minified?: boolean
}

export function buildDataItemsFeatureCollection(items: DataItem[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: items.map(item => ({
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        ...item.properties,
        name: item.name,
        date: item.date ?? '',
        layerType: item.type,
      },
    })),
  }
}

export function featureCollectionToBlob(
  fc: FeatureCollection<Geometry | null, GeoJsonProperties>,
  opts?: GeoJSONExportOptions,
): Blob {
  const indent = opts?.minified ? 0 : 2
  return new Blob([JSON.stringify(fc, null, indent)], {
    type: 'application/geo+json',
  })
}

export function buildGeoJSONBlob(items: DataItem[], opts?: GeoJSONExportOptions): Blob {
  const fc = buildDataItemsFeatureCollection(items)
  const rewound = rewindFeatureCollection(fc)
  return featureCollectionToBlob(rewound, opts)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
