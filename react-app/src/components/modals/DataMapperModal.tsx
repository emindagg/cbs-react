/**
 * DataMapper Modal
 * Opens the DataMapper (AG Grid spreadsheet + column mapping) in a centered modal
 * so it has enough horizontal space instead of being cramped in the sidebar.
 */

import { createPortal } from 'react-dom'
import DataMapper from '../visualization/DataMapper'

interface DataMapperModalProps {
    isOpen: boolean
    onClose: () => void
    geoJsonKeys: string[]
    isLoading?: boolean
}

export default function DataMapperModal({ isOpen, onClose, geoJsonKeys, isLoading }: DataMapperModalProps) {
    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-zinc-900 text-white px-5 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <i className="fa-solid fa-table-columns text-blue-400"></i>
                        <h2 className="text-sm font-semibold">Veri Eşleştirme Tablosu</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
                        <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                </div>

                {/* Content - DataMapper fills remaining space */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <DataMapper geoJsonKeys={geoJsonKeys} isLoading={isLoading} variant="modal" />
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-zinc-200 flex items-center justify-end shrink-0 bg-zinc-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium shadow-xs transition-all flex items-center hover:scale-105 active:scale-95"
                    >
                        <i className="fa-solid fa-check mr-1.5"></i>
                        Tamam
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
}
