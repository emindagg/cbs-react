import type { DataItem } from '@/stores/useDataStore'

export interface GeoJSONExportOptions {
  minified?: boolean
}

export function buildGeoJSONBlob(items: DataItem[], opts?: GeoJSONExportOptions): Blob {
  const featureCollection = {
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
  const indent = opts?.minified ? 0 : 2
  return new Blob([JSON.stringify(featureCollection, null, indent)], {
    type: 'application/geo+json',
  })
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
