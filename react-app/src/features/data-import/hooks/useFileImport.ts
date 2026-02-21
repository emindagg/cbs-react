import { useState, useRef } from 'react'
import toast from 'react-hot-toast'

import { useDataStore } from '@/stores/useDataStore'

import { parseFile } from '../services/fileParser'
import type { MapperData, ColumnMapping } from '../types'
import { transformToGeoItems } from '../utils/dataMapper'

/**
 * Hook for file import logic
 */
export function useFileImport() {
  const { addItems } = useDataStore()
  const [isLoading, setIsLoading] = useState(false)
  const [mapperData, setMapperData] = useState<MapperData | null>(null)
  const [showMapper, setShowMapper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    const extension = file.name.split('.').pop()?.toLowerCase() || ''

    try {
      const result = await parseFile(file)

      if (result.needsMapping) {
        if (!result.headers || !result.data || !result.mapping) {
          throw new Error('Sütun eşleştirme verisi eksik veya bozuk')
        }

        // Show mapper modal
        setMapperData({
          headers: result.headers,
          previewData: result.data.slice(0, 5),
          initialMapping: result.mapping,
          jsonData: result.data,
        })
        setShowMapper(true)
      } else if (result.items && result.items.length > 0) {
        addItems(result.items)
        toast.success(`${result.items.length} adet veri başarıyla yüklendi.`)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Import Error:', error)
      toast.error('Dosya yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsLoading(false)
      // Keep file input if mapper is shown
      if (fileInputRef.current && !showMapper && (extension !== 'xlsx' && extension !== 'xls' && extension !== 'csv')) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleMapperConfirm = (mapping: ColumnMapping) => {
    if (!mapperData) return

    const items = transformToGeoItems(mapperData.jsonData, mapping)

    if (items.length > 0) {
      addItems(items)
      toast.success(`${items.length} adet veri başarıyla yüklendi.`)
    }

    setShowMapper(false)
    setMapperData(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closeMapper = () => {
    setShowMapper(false)
    setMapperData(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return {
    isLoading,
    fileInputRef,
    showMapper,
    mapperData,
    handleFileImport,
    handleMapperConfirm,
    closeMapper,
  }
}
