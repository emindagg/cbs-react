import { useState } from 'react'
import toast from 'react-hot-toast'

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
      toast.error('Dışa aktarılacak veri bulunamadı.')
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

        toast.success('Proje GeoJSON olarak indirildi.')
      } else {
        toast.error(`${exportFormat.toUpperCase()} formatı henüz tam desteklenmemektedir (Sadece GeoJSON export aktiftir).`)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Dışa aktarma sırasında hata oluştu.')
    }
  }

  return {
    exportFormat,
    setExportFormat,
    handleExport,
  }
}
