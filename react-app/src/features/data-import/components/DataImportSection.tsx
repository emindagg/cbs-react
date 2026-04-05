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
    handleMapperConfirm,
    closeMapper,
  } = useFileImport()

  const {
    isLoading: urlLoading,
    handleUrlImport,
  } = useUrlImport()

  const isLoading = fileLoading || urlLoading

  return (
    <>
      <label
        htmlFor="file-upload"
        className="w-full px-2.5 py-2 bg-zinc-900 hover:bg-black text-white font-medium text-xs rounded-lg transition-all flex items-center justify-center mt-2 cursor-pointer transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-disabled={isLoading}
      >
        {isLoading ? 'Yükleniyor...' : 'Yükle'}
        <input
          ref={fileInputRef}
          id="file-upload"
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
