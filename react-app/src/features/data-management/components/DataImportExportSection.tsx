import ColumnMapperModal from './ColumnMapperModal'
import { ExportControls } from './ExportControls'
import { UrlImporter } from './UrlImporter'
import { FILE_ACCEPT_PATTERN } from '../constants/formats'
import { useDataExport } from '../hooks/useDataExport'
import { useFileImport } from '../hooks/useFileImport'
import { useUrlImport } from '../hooks/useUrlImport'

export function DataImportExportSection() {
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

  const dataExport = useDataExport()
  const isLoading = fileLoading || urlLoading

  return (
    <>
      <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">
          Veri Yonetimi
        </h3>

        <ExportControls
          exportFormat={dataExport.exportFormat}
          onFormatChange={dataExport.setExportFormat}
          onExport={dataExport.handleExport}
        />

        <label
          htmlFor="dm-file-upload"
          className="w-full px-2.5 py-2 bg-zinc-900 hover:bg-black text-white font-medium text-xs rounded-lg transition-all flex items-center justify-center mt-2 cursor-pointer transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-disabled={isLoading}
        >
          {isLoading ? 'Yukleniyor...' : 'Dosya Yukle'}
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
      </section>

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

