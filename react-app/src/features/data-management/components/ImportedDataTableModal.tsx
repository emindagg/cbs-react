import type {
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  SelectionChangedEvent,
} from 'ag-grid-community'
import { themeQuartz } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { AlertTriangle, Check, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { agGridTurkishLocaleText } from '@/shared/ag-grid'
import { useDataManagementStore } from '@/stores/useDataManagementStore'
import { getGeometryMeasurements } from '@/utils/geometryMeasurements'

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

type ConfirmVariant = 'danger' | 'default'

const DELETE_CONFIRM_DELAY_MS = 1500

export interface ConfirmState {
  title: string
  message: string
  confirmLabel: string
  variant: ConfirmVariant
  onConfirm: () => void | Promise<void>
}

interface ConfirmDialogProps {
  state: ConfirmState | null
  onCancel: () => void
}

export function ConfirmDialog({ state, onCancel }: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    if (!state) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [state, onCancel, isSubmitting])

  useEffect(() => {
    setIsSubmitting(false)
  }, [state])

  if (!state) return null

  const isDanger = state.variant === 'danger'
  const hideVisibleTitle = isDanger && state.confirmLabel === 'Sil'
  const confirmIcon = isSubmitting ? (
    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
  ) : isDanger ? (
    <Trash2 className="w-4 h-4" aria-hidden="true" />
  ) : (
    <Check className="w-4 h-4" aria-hidden="true" />
  )

  const handleConfirm = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await state.onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/15 p-4"
      onClick={() => {
        if (!isSubmitting) onCancel()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={hideVisibleTitle ? state.title : undefined}
        aria-labelledby={hideVisibleTitle ? undefined : titleId}
        aria-describedby={messageId}
        className="relative w-full max-w-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isDanger
                  ? 'bg-[#FFF1F0] text-[#FF3B30] border-[#FFC9C5]'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
            >
              <AlertTriangle className="h-5 w-5" strokeWidth={2.1} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              {!hideVisibleTitle && (
                <h3 id={titleId} className="text-[15px] font-semibold leading-5 text-slate-950">{state.title}</h3>
              )}
              <p id={messageId} className={`${hideVisibleTitle ? 'mt-0' : 'mt-1.5'} text-[13px] leading-5 text-slate-600`}>
                {state.message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex h-9 min-w-[78px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            disabled={isSubmitting}
            className={`inline-flex h-9 min-w-[92px] items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-75 ${isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-900 hover:bg-slate-800'
              }`}
          >
            {confirmIcon}
            {isSubmitting ? 'İşleniyor...' : state.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function buildRowData(items: DataItem[]) {
  return items
    .filter(item => item.source === 'imported')
    .map(item => {
      const measurements = getGeometryMeasurements(item.geometry)

      return {
        __id: item.id,
        __name: item.name,
        __geometry: item.geometry.type,
        __area: measurements.area ?? '',
        __length: measurements.length ?? '',
        ...item.properties,
      }
    })
}

export function ImportedDataTableModal({ isOpen, onClose, items }: ImportedDataTableModalProps) {
  const updateItemProperties = useDataManagementStore(s => s.updateItemProperties)
  const addImportedPropertyColumn = useDataManagementStore(s => s.addImportedPropertyColumn)
  const removeItem = useDataManagementStore(s => s.removeItem)
  const gridRef = useRef<AgGridReact>(null)
  const pendingEdits = useRef<Map<string, Record<string, unknown>>>(new Map())
  const [pendingCount, setPendingCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

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
    const ids = selected.map(r => r.__id)
    setConfirm({
      title: ids.length === 1 ? 'Veriyi sil' : 'Verileri sil',
      message: `${ids.length} satır kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      variant: 'danger',
      onConfirm: async () => {
        await new Promise(resolve => setTimeout(resolve, DELETE_CONFIRM_DELAY_MS))
        dropPendingEdits(ids)
        ids.forEach(id => removeItem(id))
        setSelectedCount(0)
        setConfirm(null)
      },
    })
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
    { field: '__area', headerName: 'Alan', minWidth: 140, editable: false },
    { field: '__length', headerName: 'Uzunluk', minWidth: 140, editable: false },
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
      setConfirm({
        title: 'Kaydedilmemiş değişiklikler',
        message: 'Yaptığınız düzenlemeler kaybolacak. Yine de çıkmak istiyor musunuz?',
        confirmLabel: 'Çıkış Yap',
        variant: 'danger',
        onConfirm: () => {
          pendingEdits.current.clear()
          setPendingCount(0)
          setSelectedCount(0)
          setConfirm(null)
          onClose()
        },
      })
      return
    }
    setSelectedCount(0)
    onClose()
  }, [onClose, setPendingCount])

  const handleAddColumn = useCallback(() => {
    const colName = newColumnName.trim()
    if (!colName) return

    if (propertyKeys.includes(colName)) {
      alert('Bu sütun zaten var.')
      return
    }

    addImportedPropertyColumn(colName)
    setIsAddingColumn(false)
    setNewColumnName('')
  }, [newColumnName, propertyKeys, addImportedPropertyColumn])

  if (!isOpen) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[2050] bg-slate-900/40 p-4 flex items-center justify-center">
        <div className="w-full max-w-6xl h-[84vh] bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Öznitelik Tablosu</h2>
              <p className="text-xs text-slate-500">{rowData.length} satır — hücreye çift tıklayarak düzenleyin</p>
            </div>
            <div className="flex items-center gap-2">
              {isAddingColumn ? (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg pr-1 pl-1">
                  <input
                    autoFocus
                    type="text"
                    value={newColumnName}
                    onChange={e => setNewColumnName(e.target.value)}
                    placeholder="Sütun Adı"
                    className="h-8 text-[13px] bg-transparent border-none outline-none focus:ring-0 px-2 w-32"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddColumn()
                      if (e.key === 'Escape') {
                        setIsAddingColumn(false)
                        setNewColumnName('')
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    disabled={!newColumnName.trim()}
                    className="w-6 h-6 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingColumn(false); setNewColumnName('') }}
                    className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Sütun Ekle
                </button>
              )}
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
      </div>
      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </>,
    document.body,
  )
}
