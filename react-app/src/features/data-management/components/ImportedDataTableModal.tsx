import {
  ClientSideRowModelModule,
  ModuleRegistry,
  ValidationModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  LocaleModule,
  type ColDef,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'

import type { DataItem } from '../types'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  LocaleModule,
  ...(process.env.NODE_ENV !== 'production' ? [ValidationModule] : []),
])

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

  const localeText = useMemo(() => ({
    // Text Filter (v35 format)
    filterOoo: 'Filtrele...',
    textFilterContains: 'İçerir',
    textFilterNotContains: 'İçermez',
    textFilterEquals: 'Eşittir',
    textFilterNotEqual: 'Eşit Değildir',
    textFilterStartsWith: 'İle Başlar',
    textFilterEndsWith: 'İle Biter',
    textFilterBlank: 'Boş',
    textFilterNotBlank: 'Boş Değil',
    // Legacy format (fallback)
    contains: 'İçerir',
    notContains: 'İçermez',
    equals: 'Eşittir',
    notEqual: 'Eşit Değildir',
    startsWith: 'İle Başlar',
    endsWith: 'İle Biter',
    blank: 'Boş',
    notBlank: 'Boş Değil',
    // Number Filter (v35 format)
    numberFilterEquals: 'Eşittir',
    numberFilterNotEqual: 'Eşit Değildir',
    numberFilterLessThan: 'Küçüktür',
    numberFilterGreaterThan: 'Büyüktür',
    numberFilterLessThanOrEqual: 'Küçük Eşittir',
    numberFilterGreaterThanOrEqual: 'Büyük Eşittir',
    numberFilterInRange: 'Aralıkta',
    numberFilterInRangeStart: 'Başlangıç',
    numberFilterInRangeEnd: 'Bitiş',
    // Legacy format (fallback)
    lessThan: 'Küçüktür',
    greaterThan: 'Büyüktür',
    lessThanOrEqual: 'Küçük Eşittir',
    greaterThanOrEqual: 'Büyük Eşittir',
    inRange: 'Aralıkta',
    // Date Filter (v35 format)
    dateFormatOoo: 'gg.aa.yyyy',
    dateFilterBefore: 'Önce',
    dateFilterAfter: 'Sonra',
    dateFilterEquals: 'Eşittir',
    dateFilterNotEqual: 'Eşit Değildir',
    // Legacy format (fallback)
    before: 'Önce',
    after: 'Sonra',
    // Common Filter Buttons
    applyFilter: 'Uygula',
    resetFilter: 'Sıfırla',
    clearFilter: 'Temizle',
    // Pagination
    page: 'Sayfa',
    to: '-',
    of: '/',
    nextPage: 'Sonraki Sayfa',
    lastPage: 'Son Sayfa',
    firstPage: 'İlk Sayfa',
    previousPage: 'Önceki Sayfa',
    // Other
    noRowsToShow: 'Gösterilecek satır yok',
    loadingOoo: 'Yükleniyor...',
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
              localeText={localeText}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
