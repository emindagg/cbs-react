import { rewindFeatureCollection } from '@placemarkio/geojson-rewind'

import {
  buildDataItemsFeatureCollection,
  featureCollectionToBlob,
} from '@/utils/geojsonExport'
import type { GeoJSONExportOptions } from '@/utils/geojsonExport'

import type { DataItem } from '../../types'

export type { GeoJSONExportOptions }

export function exportAsGeoJSON(items: DataItem[], opts?: GeoJSONExportOptions): Blob {
  const fc = buildDataItemsFeatureCollection(items)
  const rewound = rewindFeatureCollection(fc)
  return featureCollectionToBlob(rewound, opts)
}
