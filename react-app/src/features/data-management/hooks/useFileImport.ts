import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { parseFile } from '../services/import/fileParser'
import { useDataManagementStore } from '../store/useDataManagementStore'
import type { ColumnMapping, MapperData } from '../types'
import { transformToGeoItems } from '../utils/dataMapper'

export function useFileImport() {
  const addItems = useDataManagementStore(state => state.addItems)
  const [isLoading, setIsLoading] = useState(false)
  const [mapperData, setMapperData] = useState<MapperData | null>(null)
  const [showMapper, setShowMapper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedSourceLabelRef = useRef<string | null>(null)

  const importFromFile = async (file: File) => {
    selectedSourceLabelRef.current = file.name
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
        const CHUNK_SIZE = 2000
        const mappedItems = result.items.map(item => ({ ...item, sourceLabel: file.name }))
        if (mappedItems.length > CHUNK_SIZE) {
          for (let i = 0; i < mappedItems.length; i += CHUNK_SIZE) {
            addItems(mappedItems.slice(i, i + CHUNK_SIZE))
            if (i + CHUNK_SIZE < mappedItems.length) {
              await new Promise<void>(r => setTimeout(r, 0))
            }
          }
        } else {
          addItems(mappedItems)
        }
        selectedSourceLabelRef.current = null
        toast.success(`${result.items.length} veri yuklendi.`)
      } else {
        selectedSourceLabelRef.current = null
        toast.error('Dosyada aktarilabilir veri bulunamadi.')
      }
    } catch (error) {
      selectedSourceLabelRef.current = null
      console.error('File import error:', error)
      toast.error(error instanceof Error ? error.message : 'Dosya yuklenemedi.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsLoading(false)
    }
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await importFromFile(file)
  }

  const handleDroppedFile = async (file: File) => {
    await importFromFile(file)
  }

  const handleMapperConfirm = async (mapping: ColumnMapping) => {
    if (!mapperData) return

    const items = transformToGeoItems(mapperData.jsonData, mapping)

    if (items.length > 0) {
      const CHUNK_SIZE = 2000
      const sourceLabel = selectedSourceLabelRef.current ?? 'Excel Import'
      const mappedItems = items.map(item => ({ ...item, sourceLabel }))
      if (mappedItems.length > CHUNK_SIZE) {
        for (let i = 0; i < mappedItems.length; i += CHUNK_SIZE) {
          addItems(mappedItems.slice(i, i + CHUNK_SIZE))
          if (i + CHUNK_SIZE < mappedItems.length) {
            await new Promise<void>(r => setTimeout(r, 0))
          }
        }
      } else {
        addItems(mappedItems)
      }
      toast.success(`${items.length} veri yuklendi.`)
    } else {
      toast.error('Secilen eslestirmeden veri uretilemedi.')
    }

    selectedSourceLabelRef.current = null
    setShowMapper(false)
    setMapperData(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closeMapper = () => {
    selectedSourceLabelRef.current = null
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
    handleDroppedFile,
    handleMapperConfirm,
    closeMapper,
  }
}
