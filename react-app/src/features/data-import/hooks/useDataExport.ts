import { useState } from 'react'

import { useDataStore } from '@/stores/useDataStore'

import type { ExportFormat } from '../types'

/**
 * Hook for data export logic
 */
export function useDataExport() {
  const { items } = useDataStore()
  const [exportFormat, setExportFormat] = useState<ExportFormat>('geojson')

  const handleExport = () => {
    if (items.length === 0) {
      alert('Dışa aktarılacak veri bulunamadı.')
      return
    }

    try {
      if (exportFormat === 'geojson') {
        const featureCollection = {
          type: 'FeatureCollection',
          features: items.map(item => ({
            type: 'Feature',
            geometry: item.geometry,
            properties: { ...item.properties, name: item.name, date: item.date },
          })),
        }

        const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
          type: 'application/geo+json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cbs-proje-${new Date().toISOString().slice(0, 10)}.geojson`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        alert('Proje GeoJSON olarak indirildi.')
      } else {
        alert(`${exportFormat.toUpperCase()} formatı henüz tam desteklenmemektedir (Sadece GeoJSON export aktiftir).`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Dışa aktarma sırasında hata oluştu.')
    }
  }

  return {
    exportFormat,
    setExportFormat,
    handleExport,
  }
}
