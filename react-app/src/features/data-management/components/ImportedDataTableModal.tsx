import type {
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  SelectionChangedEvent,
} from 'ag-grid-community'
import { themeQuartz } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { Check, Trash2, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { agGridTurkishLocaleText } from '@/shared/ag-grid'
import { useDataManagementStore } from '@/stores/useDataManagementStore'

import type { DataItem } from '../types'

const COLUMN_HEADER_TR: Record<string, string> = {
  name: 'Ad',
  date: 'Tarih',
  createdAt: 'Oluşturma Tarihi',
  layerType: 'Katman Türü',
  style: 'Stil',
  type: 'Tür',
  source: 'Kaynak',
  sourceLabel: 'Kaynak Etiketi',
  visible: 'Görünür',
  description: 'Açıklama',
  color: 'Renk',
  fillColor: 'Dolgu Rengi',
  strokeColor: 'Çerçeve Rengi',
  opacity: 'Opaklık',
  width: 'Genişlik',
  height: 'Yükseklik',
  area: 'Alan',
  length: 'Uzunluk',
  label: 'Etiket',
  title: 'Başlık',
  value: 'Değer',
  category: 'Kategori',
  id: 'ID',
}

interface ImportedDataTableModalProps {
  isOpen: boolean
  onClose: () => void
  items: DataItem[]
}

function buildRowData(items: DataItem[]) {
  return items
    .filter(item => item.source === 'imported')
    .map(item => ({
      __id: item.id,
      __name: item.name,
      __geometry: item.geometry.type,
      ...item.properties,
    }))
}

export function ImportedDataTableModal({ isOpen, onClose, items }: ImportedDataTableModalProps) {
  const updateItemProperties = useDataManagementStore(s => s.updateItemProperties)
  const removeItem = useDataManagementStore(s => s.removeItem)
  const gridRef = useRef<AgGridReact>(null)
  const pendingEdits = useRef<Map<string, Record<string, unknown>>>(new Map())
  const [pendingCount, setPendingCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)

  const dropPendingEdits = useCallback((ids: string[]) => {
    let changed = false
    ids.forEach((id) => {
      if (pendingEdits.current.delete(id)) changed = true
    })
    if (changed) setPendingCount(pendingEdits.current.size)
  }, [])

  const handleDeleteSelected = useCallback(() => {
    const api = gridRef.current?.api
    if (!api) return
    const selected = api.getSelectedRows() as Array<{ __id: string }>
    if (selected.length === 0) return
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`${selected.length} satır silinecek. Emin misiniz?`)
    if (!confirmed) return
    const ids = selected.map(r => r.__id)
    dropPendingEdits(ids)
    ids.forEach(id => removeItem(id))
    setSelectedCount(0)
  }, [dropPendingEdits, removeItem])

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    setSelectedCount(event.api.getSelectedRows().length)
  }, [])

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

  const rowData = useMemo(() => buildRowData(items), [items])

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: '__name', headerName: 'Ad', minWidth: 180, pinned: 'left', editable: false },
    { field: '__geometry', headerName: 'Geometri', minWidth: 140, editable: false },
    ...propertyKeys.map(key => ({
      field: key,
      headerName: COLUMN_HEADER_TR[key] ?? key,
      minWidth: 140,
      sortable: true,
      filter: true,
      editable: true,
    })),
  ], [propertyKeys])

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 110,
    sortable: true,
    filter: true,
    resizable: true,
  }), [])

  const getRowId = useCallback((params: GetRowIdParams) => params.data.__id as string, [])

  const onCellValueChanged = useCallback((e: CellValueChangedEvent) => {
    const id = e.data.__id as string
    const field = e.colDef.field
    if (!field || field.startsWith('__')) return

    const existing = pendingEdits.current.get(id) ?? {}
    pendingEdits.current.set(id, { ...existing, [field]: e.newValue })
    setPendingCount(pendingEdits.current.size)
  }, [setPendingCount])

  const handleSave = useCallback(() => {
    pendingEdits.current.forEach((props, id) => {
      updateItemProperties(id, props)
    })
    pendingEdits.current.clear()
    setPendingCount(0)
  }, [updateItemProperties, setPendingCount])

  const handleDiscard = useCallback(() => {
    pendingEdits.current.clear()
    setPendingCount(0)
    // Grid'in in-memory satırlarını store'daki orijinal veriye döndür
    gridRef.current?.api.setGridOption('rowData', buildRowData(items))
  }, [items, setPendingCount])

  const handleClose = useCallback(() => {
    if (pendingEdits.current.size > 0) {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')
      if (!confirmed) return
      pendingEdits.current.clear()
      setPendingCount(0)
    }
    setSelectedCount(0)
    onClose()
  }, [onClose, setPendingCount])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[2050] bg-slate-900/40 p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl h-[84vh] bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Öznitelik Tablosu</h2>
            <p className="text-xs text-slate-500">{rowData.length} satır — hücreye çift tıklayarak düzenleyin</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Seçilenleri Sil ({selectedCount})
              </button>
            )}
            {pendingCount > 0 && (
              <>
                <span className="text-xs text-amber-600 font-medium">{pendingCount} satırda değişiklik</span>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Geri Al
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Kaydet
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 border border-slate-200 rounded-lg inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 p-3 bg-white">
          <div className="w-full h-full border border-slate-200 rounded-lg overflow-hidden">
            <AgGridReact
              ref={gridRef}
              theme={themeQuartz}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              getRowId={getRowId}
              suppressMovableColumns
              animateRows={false}
              localeText={agGridTurkishLocaleText}
              onCellValueChanged={onCellValueChanged}
              onSelectionChanged={onSelectionChanged}
              rowSelection={{
                mode: 'multiRow',
                checkboxes: true,
                headerCheckbox: true,
                enableClickSelection: false,
              }}
              selectionColumnDef={{
                pinned: 'left',
                width: 48,
                minWidth: 48,
                maxWidth: 48,
                resizable: false,
                suppressHeaderMenuButton: true,
              }}
              stopEditingWhenCellsLoseFocus
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
