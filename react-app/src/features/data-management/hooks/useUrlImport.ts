import { useState } from 'react'
import toast from 'react-hot-toast'

import { useDataManagementStore } from '../store/useDataManagementStore'
import type { NewDataItem } from '../types'
import { parseGeoJSON } from '../services/import/geoJsonProcessor'
import { parseKML } from '../services/import/kmlProcessor'
import { parseShapefile } from '../services/import/shapefileProcessor'

export function useUrlImport() {
  const addItems = useDataManagementStore(state => state.addItems)
  const [isLoading, setIsLoading] = useState(false)

  const handleUrlImport = async (urlInput: string, onSuccess: () => void) => {
    if (!urlInput) return

    setIsLoading(true)
    try {
      const response = await fetch(urlInput)
      if (!response.ok) throw new Error('URL indirilemedi')

      let items: NewDataItem[] = []
      const lowerUrl = urlInput.toLowerCase()

      if (lowerUrl.endsWith('.zip')) {
        const buffer = await response.arrayBuffer()
        items = await parseShapefile(buffer, 'URL Import')
      } else if (lowerUrl.endsWith('.kml')) {
        const text = await response.text()
        items = await parseKML(text, 'URL Import')
      } else {
        const json = await response.json()
        items = parseGeoJSON(json, 'URL Import')
      }

      if (items.length > 0) {
        addItems(items)
        toast.success(`${items.length} veri URL uzerinden yuklendi.`)
      } else {
        toast.error('URL iceriginde aktarilabilir veri bulunamadi.')
      }

      onSuccess()
    } catch (error) {
      console.error('URL import error:', error)
      toast.error('URL yuklemede hata olustu. CORS veya format kontrol edin.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    handleUrlImport,
  }
}

