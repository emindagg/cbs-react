import type {
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  SelectionChangedEvent,
} from 'ag-grid-community'
import { themeQuartz } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { AlertTriangle, Check, Loader2, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type ConfirmVariant = 'danger' | 'default'

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
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/10 p-4"
      onClick={() => {
        if (!isSubmitting) onCancel()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-[560px] bg-[#f4f4f5] rounded-2xl border border-black/[0.06] shadow-[0_20px_34px_rgba(17,24,28,0.08)] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-12 h-12 rounded-xl inline-flex items-center justify-center border ${
                state.variant === 'danger'
                  ? 'bg-[#FFF1F0] text-[#FF3B30] border-[#FFC9C5]'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-[22px] h-[22px]" strokeWidth={2.1} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-[14px] font-semibold text-[#11181C] leading-tight">{state.title}</h3>
              <p className="mt-2 text-[13px] text-[#687076] leading-relaxed">{state.message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-9 min-w-[66px] px-3.5 text-[13px] font-medium text-[#5f6b73] border border-black/[0.08] bg-[#f3f3f4] rounded-[9px] hover:bg-[#ededee] hover:text-[#2f363d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            disabled={isSubmitting}
            className={`h-9 min-w-[86px] px-4 text-[13px] font-medium text-white rounded-[9px] transition-colors disabled:cursor-not-allowed disabled:opacity-75 inline-flex items-center justify-center gap-1 ${
              state.variant === 'danger'
                ? 'bg-[#FF3B30] hover:bg-[#F02A1F]'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                İşleniyor...
              </>
            ) : (
              state.confirmLabel
            )}
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
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

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
        await new Promise(resolve => setTimeout(resolve, 1500))
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
