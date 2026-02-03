import ColumnMapperModal from '@/components/modals/ColumnMapperModal'

import { ExportControls } from './ExportControls'
import { UrlImporter } from './UrlImporter'
import { FILE_ACCEPT_PATTERN } from '../constants/formats'
import { useDataExport } from '../hooks/useDataExport'
import { useFileImport } from '../hooks/useFileImport'
import { useUrlImport } from '../hooks/useUrlImport'

/**
 * Main data import section component
 */
export function DataImportSection() {
  const fileImport = useFileImport()
  const urlImport = useUrlImport()
  const dataExport = useDataExport()

  const isLoading = fileImport.isLoading || urlImport.isLoading

  return (
    <>
      <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">
          Proje Yönetimi
        </h3>

        <ExportControls
          exportFormat={dataExport.exportFormat}
          onFormatChange={dataExport.setExportFormat}
          onExport={dataExport.handleExport}
        />

        <div className="grid grid-cols-2 gap-2">
          <label className={`bg-zinc-700 hover:bg-zinc-800 text-white font-medium py-2 px-3 rounded-lg text-center cursor-pointer text-sm transition-all flex items-center justify-center hover:scale-[1.02] active:scale-95 shadow-sm ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
            <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-upload'} mr-1.5`}></i>
            {isLoading ? 'Yükleniyor...' : 'Yükle'}
            <input
              ref={fileImport.fileInputRef}
              type="file"
              className="hidden"
              accept={FILE_ACCEPT_PATTERN}
              onChange={fileImport.handleFileImport}
            />
          </label>
          <button
            className="border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-medium py-2 px-2 rounded-lg text-xs transition-all opacity-50 cursor-not-allowed flex items-center justify-center"
            disabled
          >
            <i className="fa-solid fa-chart-bar mr-1"></i>Rapor
          </button>
        </div>

        <UrlImporter
          onImport={urlImport.handleUrlImport}
          isLoading={urlImport.isLoading}
        />
      </section>

      {/* Column Mapper Modal */}
      {fileImport.mapperData && (
        <ColumnMapperModal
          isOpen={fileImport.showMapper}
          onClose={fileImport.closeMapper}
          onConfirm={fileImport.handleMapperConfirm}
          headers={fileImport.mapperData.headers}
          previewData={fileImport.mapperData.previewData}
          initialMapping={fileImport.mapperData.initialMapping}
        />
      )}
    </>
  )
}
