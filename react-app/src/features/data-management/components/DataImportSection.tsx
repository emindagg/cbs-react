import { Loader2, Upload } from 'lucide-react'
import { useState } from 'react'

import { useVideoModalStore } from '@/stores/useVideoModalStore'

import ColumnMapperModal from './ColumnMapperModal'
import { UrlImporter } from './UrlImporter'
import { FILE_ACCEPT_PATTERN } from '../constants/formats'
import { useFileImport } from '../hooks/useFileImport'
import { useUrlImport } from '../hooks/useUrlImport'

export function DataImportSection() {
  const {
    isLoading: fileLoading,
    fileInputRef,
    showMapper,
    mapperData,
    handleFileImport,
    handleDroppedFile,
    handleMapperConfirm,
    closeMapper,
  } = useFileImport()

  const {
    isLoading: urlLoading,
    handleUrlImport,
  } = useUrlImport()

  const isLoading = fileLoading || urlLoading
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    if (isLoading) return
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setIsDragOver(false)
  }

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    if (isLoading) return

    const file = event.dataTransfer.files?.[0]
    if (!file) return
    await handleDroppedFile(file)
  }

  const uploadLabel = isLoading
    ? 'Yükleniyor...'
    : isDragOver
      ? 'Dosyayı bırakın'
      : 'Dosya Yükle'

  return (
    <>
      <label
        htmlFor="dm-file-upload"
        className={`w-full px-2.5 py-2 text-white font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDragOver && !isLoading ? 'bg-zinc-800 border border-dashed border-zinc-300 ring-2 ring-zinc-500 ring-offset-1 ring-offset-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)_inset]' : 'bg-zinc-900 hover:bg-black border border-transparent'}`}
        aria-disabled={isLoading}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(event) => { void handleDrop(event) }}
      >
        {isLoading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          : <Upload className={`w-3.5 h-3.5 ${isDragOver ? 'animate-bounce' : ''}`} aria-hidden="true" />}
        <span>{uploadLabel}</span>
        {isDragOver && !isLoading && (
          <span className="text-[10px] text-zinc-300 font-normal">
            .geojson, .json, .kml, .zip, .xlsx, .xls, .csv
          </span>
        )}
        <input
          ref={fileInputRef}
          id="dm-file-upload"
          type="file"
          className="hidden"
          accept={FILE_ACCEPT_PATTERN}
          onChange={handleFileImport}
          disabled={isLoading}
        />
      </label>

      <UrlImporter
        onImport={handleUrlImport}
        isLoading={urlLoading}
      />

      <button
        type="button"
        onClick={() => useVideoModalStore.getState().open()}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-normal text-[#1c1c1e] transition-colors"
        title="Eğitim videolarını aç"
      >
        <i className="fa-regular fa-circle-question text-sm" aria-hidden />
        <span>Nasıl Kullanılır?</span>
      </button>

      {mapperData && (
        <ColumnMapperModal
          isOpen={showMapper}
          onClose={closeMapper}
          onConfirm={handleMapperConfirm}
          headers={mapperData.headers}
          previewData={mapperData.previewData}
          initialMapping={mapperData.initialMapping}
        />
      )}
    </>
  )
}
