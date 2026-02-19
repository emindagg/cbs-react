import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useDataManagementStore } from '../store/useDataManagementStore'
import type { ColumnMapping, MapperData } from '../types'
import { parseFile } from '../services/import/fileParser'
import { transformToGeoItems } from '../utils/dataMapper'

export function useFileImport() {
  const addItems = useDataManagementStore(state => state.addItems)
  const [isLoading, setIsLoading] = useState(false)
  const [mapperData, setMapperData] = useState<MapperData | null>(null)
  const [showMapper, setShowMapper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    try {
      const result = await parseFile(file)

      if (result.needsMapping) {
        setMapperData({
          headers: result.headers ?? [],
          previewData: result.data?.slice(0, 5) ?? [],
          initialMapping: result.mapping ?? {},
          jsonData: result.data ?? [],
        })
        setShowMapper(true)
      } else if (result.items && result.items.length > 0) {
        addItems(result.items)
        toast.success(`${result.items.length} veri yuklendi.`)
      } else {
        toast.error('Dosyada aktarilabilir veri bulunamadi.')
      }
    } catch (error) {
      console.error('File import error:', error)
      toast.error(error instanceof Error ? error.message : 'Dosya yuklenemedi.')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current && !showMapper) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleMapperConfirm = (mapping: ColumnMapping) => {
    if (!mapperData) return

    const items = transformToGeoItems(mapperData.jsonData, mapping)

    if (items.length > 0) {
      addItems(items)
      toast.success(`${items.length} veri yuklendi.`)
    } else {
      toast.error('Secilen eslestirmeden veri uretilemedi.')
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

