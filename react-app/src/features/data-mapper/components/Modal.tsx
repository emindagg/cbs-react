/**
 * DataMapper Modal
 * Opens the DataMapper (AG Grid spreadsheet + column mapping) in a centered modal.
 * If an Excel file needs header selection (pendingExcel), shows ExcelHeaderPanel first.
 */

import { createPortal } from 'react-dom'

import { useVisualizationStore } from '@/stores/useVisualizationStore'

import DataMapper from '../DataMapper'
import { ExcelHeaderPanel } from './ExcelHeaderPanel'

interface DataMapperModalProps {
  isOpen: boolean
  onClose: () => void
  geoJsonKeys: string[]
  isLoading?: boolean
}

export default function DataMapperModal({ isOpen, onClose, geoJsonKeys, isLoading }: DataMapperModalProps) {
  const { pendingExcel, rawData } = useVisualizationStore()

  if (!isOpen) return null

  const showExcelPanel = pendingExcel !== null && rawData === null
  const title = showExcelPanel ? 'Excel Yapılandırması' : 'Veri Eşleştirme'
  const icon = showExcelPanel ? 'fa-file-excel' : 'fa-table-columns'

  return createPortal(
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#18181B] text-white px-5 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
              <i className={`fa-solid ${icon} text-[11px] text-emerald-400`}></i>
            </div>
            <h2 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {showExcelPanel ? (
            <ExcelHeaderPanel pending={pendingExcel} />
          ) : (
            <DataMapper geoJsonKeys={geoJsonKeys} isLoading={isLoading} variant="modal" />
          )}
        </div>

        {/* Footer — only shown in DataMapper mode; ExcelHeaderPanel has its own footer */}
        {!showExcelPanel && (
          <div className="px-4 py-2 border-t border-zinc-100 flex items-center justify-end shrink-0 bg-[#fafbfc]">
            <button
              onClick={onClose}
              className="px-5 py-1.5 text-[11px] text-white bg-[#18181B] hover:bg-zinc-800 rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <i className="fa-solid fa-check text-emerald-400 text-[10px]"></i>
              Tamam
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
