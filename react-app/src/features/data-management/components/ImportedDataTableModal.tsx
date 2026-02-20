import { ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'

import { agGridTurkishLocaleText, fullGridModules } from '@/shared/ag-grid'

import type { DataItem } from '../types'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules(fullGridModules)

interface ImportedDataTableModalProps {
  isOpen: boolean
  onClose: () => void
  items: DataItem[]
}

export function ImportedDataTableModal({ isOpen, onClose, items }: ImportedDataTableModalProps) {
  const importedItems = useMemo(
    () => items.filter(item => item.source === 'imported'),
    [items],
  )

  const propertyKeys = useMemo(() => {
    const keySet = new Set<string>()
    importedItems.forEach((item) => {
      Object.keys(item.properties).forEach(key => keySet.add(key))
    })
    return Array.from(keySet)
  }, [importedItems])

  const rowData = useMemo(() => importedItems.map(item => ({
    __id: item.id,
    __name: item.name,
    __geometry: item.geometry.type,
    ...item.properties,
  })), [importedItems])

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: '__name', headerName: 'Ad', minWidth: 180, pinned: 'left' },
    { field: '__geometry', headerName: 'Geometri', minWidth: 140 },
    ...propertyKeys.map(key => ({
      field: key,
      headerName: key,
      minWidth: 140,
      sortable: true,
      filter: true,
    })),
  ], [propertyKeys])

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 110,
    sortable: true,
    filter: true,
    resizable: true,
  }), [])


  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[2050] bg-slate-900/40 p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl h-[84vh] bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Öznitelik Tablosu</h2>
            <p className="text-xs text-slate-600">{rowData.length} satır</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 border border-slate-200 rounded-lg inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 p-3 bg-white">
          <div className="ag-theme-alpine w-full h-full border border-slate-200 rounded-lg overflow-hidden">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              suppressMovableColumns
              animateRows={false}
              theme="legacy"
              localeText={agGridTurkishLocaleText}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
