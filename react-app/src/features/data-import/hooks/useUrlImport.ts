import { useState } from 'react'
import toast from 'react-hot-toast'

import { useDataStore } from '@/stores/useDataStore'

import { parseGeoJSON } from '../services/geoJsonProcessor'
import { parseKML } from '../services/kmlProcessor'
import { parseShapefile } from '../services/shapefileProcessor'

type GeoItem = ReturnType<typeof parseGeoJSON>[number]

/**
 * Hook for URL import logic
 */
export function useUrlImport() {
  const { addItems } = useDataStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleUrlImport = async (urlInput: string, onSuccess: () => void) => {
    if (!urlInput) return

    setIsLoading(true)
    try {
      const response = await fetch(urlInput)
      if (!response.ok) throw new Error('Dosya indirilemedi')

      let items: GeoItem[] = []
      const pathname = new URL(urlInput).pathname.toLowerCase()

      if (pathname.endsWith('.zip')) {
        const buffer = await response.arrayBuffer()
        items = await parseShapefile(buffer, 'URL Import')
      } else if (pathname.endsWith('.kml')) {
        const text = await response.text()
        items = await parseKML(text, 'URL Import')
      } else {
        const json = await response.json()
        items = parseGeoJSON(json, 'URL Import')
      }

      if (items.length > 0) {
        addItems(items)
        toast.success(`${items.length} adet veri URL'den yüklendi.`)
      }
      onSuccess()
    } catch (error) {
      console.error('URL Import Error:', error)
      toast.error('URL yüklenirken hata oluştu. CORS kısıtlamaları veya geçersiz URL olabilir.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    handleUrlImport,
  }
}
