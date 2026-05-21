import type {
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  RowClassRules,
  RowClickedEvent,
  SelectionChangedEvent,
} from 'ag-grid-community'
import { themeQuartz } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { AlertTriangle, Check, GripHorizontal, GripVertical, Loader2, Plus, Trash2, X } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent } from 'react'
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
  sourceFilter?: 'drawn' | 'imported'
}

type ConfirmVariant = 'danger' | 'default'
type InteractionMode =
  | 'move'
  | 'resize-left'
  | 'resize-right'
  | 'resize-top'
  | 'resize-bottom'
  | 'resize-top-left'
  | 'resize-top-right'
  | 'resize-bottom-left'
  | 'resize-bottom-right'

interface FloatingRect {
  left: number
  top: number
  width: number
  height: number
}

const DELETE_CONFIRM_DELAY_MS = 1500
const DEFAULT_WINDOW_HEIGHT_RATIO = 0.38
const DEFAULT_WINDOW_WIDTH_RATIO = 0.96
const MIN_WINDOW_WIDTH = 520
const MIN_WINDOW_HEIGHT = 220
const VIEWPORT_PADDING = 12
const TABLE_ROW_HEIGHT = 28
const TABLE_HEADER_HEIGHT = 42

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function clampFloatingRect(rect: FloatingRect): FloatingRect {
  const viewport = getViewportSize()
  const maxWidth = Math.max(MIN_WINDOW_WIDTH, viewport.width - (VIEWPORT_PADDING * 2))
  const maxHeight = Math.max(MIN_WINDOW_HEIGHT, viewport.height - (VIEWPORT_PADDING * 2))
  const width = clamp(rect.width, Math.min(MIN_WINDOW_WIDTH, maxWidth), maxWidth)
  const height = clamp(rect.height, Math.min(MIN_WINDOW_HEIGHT, maxHeight), maxHeight)
  const left = clamp(rect.left, VIEWPORT_PADDING, viewport.width - width - VIEWPORT_PADDING)
  const top = clamp(rect.top, VIEWPORT_PADDING, viewport.height - height - VIEWPORT_PADDING)

  return { left, top, width, height }
}

function createDefaultFloatingRect(): FloatingRect {
  const viewport = getViewportSize()
  const width = Math.min(viewport.width - (VIEWPORT_PADDING * 2), viewport.width * DEFAULT_WINDOW_WIDTH_RATIO)
  const height = Math.min(viewport.height - (VIEWPORT_PADDING * 2), viewport.height * DEFAULT_WINDOW_HEIGHT_RATIO)

  return clampFloatingRect({
    left: (viewport.width - width) / 2,
    top: viewport.height - height - VIEWPORT_PADDING,
    width,
    height,
  })
}

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

function buildRowData(items: DataItem[], sourceFilter?: 'drawn' | 'imported') {
  return items
    .filter(item => !sourceFilter || item.source === sourceFilter)
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

export function ImportedDataTableModal({ isOpen, onClose, items, sourceFilter }: ImportedDataTableModalProps) {
  const updateItemProperties = useDataManagementStore(s => s.updateItemProperties)
  const addPropertyColumn = useDataManagementStore(s => s.addPropertyColumn)
  const removeItem = useDataManagementStore(s => s.removeItem)
  const selectedItemIds = useDataManagementStore(s => s.selectedItemIds)
  const setSelectedItems = useDataManagementStore(s => s.setSelectedItems)
  const clearSelectedItems = useDataManagementStore(s => s.clearSelectedItems)
  const activeItemId = useDataManagementStore(s => s.activeItemId)
  const setActiveItem = useDataManagementStore(s => s.setActiveItem)
  const clearActiveItem = useDataManagementStore(s => s.clearActiveItem)
  const gridRef = useRef<AgGridReact>(null)
  const pendingEdits = useRef<Map<string, Record<string, unknown>>>(new Map())
  const isSyncingSelection = useRef(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [windowRect, setWindowRect] = useState<FloatingRect>(() => createDefaultFloatingRect())
  const interactionStartRef = useRef<{
    mode: InteractionMode
    startX: number
    startY: number
    startRect: FloatingRect
  } | null>(null)

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
        setConfirm(null)
      },
    })
  }, [dropPendingEdits, removeItem])

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    if (isSyncingSelection.current) return
    const selected = event.api.getSelectedRows() as Array<{ __id: string }>
    const ids = selected.map(row => row.__id)
    setSelectedItems(ids)
  }, [setSelectedItems])

  const onRowClicked = useCallback((event: RowClickedEvent) => {
    if (event.event instanceof MouseEvent && event.event.detail > 1) return
    const id = event.data?.__id as string | undefined
    if (!id) return
    if (id === activeItemId) {
      clearActiveItem()
      return
    }
    setActiveItem(id)
  }, [activeItemId, clearActiveItem, setActiveItem])

  const filteredItems = useMemo(
    () => items.filter(item => !sourceFilter || item.source === sourceFilter),
    [items, sourceFilter],
  )

  const propertyKeys = useMemo(() => {
    const keySet = new Set<string>()
    filteredItems.forEach((item) => {
      Object.keys(item.properties).forEach(key => keySet.add(key))
    })
    // Çizim işlemi sırasında createdAt ekleniyor olabilir, bunu saklamak veya göstermek isteyebiliriz.
    return Array.from(keySet)
  }, [filteredItems])

  const rowData = useMemo(() => buildRowData(items, sourceFilter), [items, sourceFilter])
  const selectedCount = useMemo(() => {
    const visibleIds = new Set(rowData.map(row => row.__id as string))
    return selectedItemIds.filter(id => visibleIds.has(id)).length
  }, [rowData, selectedItemIds])

  useEffect(() => {
    const handleViewportResize = () => {
      setWindowRect(current => clampFloatingRect(current))
    }

    window.addEventListener('resize', handleViewportResize)
    return () => window.removeEventListener('resize', handleViewportResize)
  }, [])

  useEffect(() => {
    const api = gridRef.current?.api
    if (!api) return

    const visibleIds = new Set(rowData.map(row => row.__id as string))
    const selectedIds = new Set(selectedItemIds.filter(id => visibleIds.has(id)))

    isSyncingSelection.current = true
    api.forEachNode((node) => {
      const id = node.data?.__id as string | undefined
      node.setSelected(Boolean(id && selectedIds.has(id)))
    })
    isSyncingSelection.current = false
  }, [rowData, selectedItemIds])

  useEffect(() => {
    const api = gridRef.current?.api
    if (!api) return

    api.redrawRows()
    if (!activeItemId) return
    const node = api.getRowNode(activeItemId)
    if (!node) return
    api.ensureNodeVisible(node, 'middle')
  }, [activeItemId])

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
  const rowClassRules = useMemo<RowClassRules>(() => ({
    'attribute-table-active-row': params => params.data?.__id === activeItemId,
  }), [activeItemId])

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
    gridRef.current?.api.setGridOption('rowData', buildRowData(items, sourceFilter))
  }, [items, sourceFilter, setPendingCount])

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
          setConfirm(null)
          onClose()
        },
      })
      return
    }
    onClose()
  }, [onClose, setPendingCount])

  const handleAddColumn = useCallback(() => {
    const colName = newColumnName.trim()
    if (!colName) return

    if (propertyKeys.includes(colName)) {
      alert('Bu sütun zaten var.')
      return
    }

    addPropertyColumn(colName, '', sourceFilter)
    setIsAddingColumn(false)
    setNewColumnName('')
  }, [newColumnName, propertyKeys, addPropertyColumn, sourceFilter])

  const clearGridSelection = useCallback(() => {
    const api = gridRef.current?.api
    if (!api) return

    isSyncingSelection.current = true
    api.deselectAll()
    isSyncingSelection.current = false
  }, [])

  const handleCancelOrClose = useCallback(() => {
    if (isAddingColumn) {
      setIsAddingColumn(false)
      setNewColumnName('')
      return
    }

    if (selectedCount > 0) {
      clearGridSelection()
      clearSelectedItems()
      return
    }

    handleClose()
  }, [clearGridSelection, clearSelectedItems, handleClose, isAddingColumn, selectedCount])

  const handleInteractionStart = useCallback((event: ReactPointerEvent<HTMLDivElement>, mode: InteractionMode) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    interactionStartRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startRect: windowRect,
    }
  }, [windowRect])

  const handleInteractionMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const interactionStart = interactionStartRef.current
    if (!interactionStart) return

    const dx = event.clientX - interactionStart.startX
    const dy = event.clientY - interactionStart.startY
    const { mode, startRect } = interactionStart

    if (mode === 'move') {
      setWindowRect(clampFloatingRect({
        ...startRect,
        left: startRect.left + dx,
        top: startRect.top + dy,
      }))
      return
    }

    const startRight = startRect.left + startRect.width
    const startBottom = startRect.top + startRect.height
    let left = startRect.left
    let top = startRect.top
    let width = startRect.width
    let height = startRect.height

    if (mode.includes('left')) {
      left = Math.min(startRight - MIN_WINDOW_WIDTH, startRect.left + dx)
      width = startRight - left
    }

    if (mode.includes('right')) {
      width = Math.max(MIN_WINDOW_WIDTH, startRect.width + dx)
    }

    if (mode.includes('top')) {
      top = Math.min(startBottom - MIN_WINDOW_HEIGHT, startRect.top + dy)
      height = startBottom - top
    }

    if (mode.includes('bottom')) {
      height = Math.max(MIN_WINDOW_HEIGHT, startRect.height + dy)
    }

    setWindowRect(clampFloatingRect({ left, top, width, height }))
  }, [])

  const handleInteractionEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactionStartRef.current) return
    interactionStartRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  if (!isOpen) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[2050] pointer-events-none">
        <section
          aria-label="Öznitelik Tablosu"
          className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-[0_18px_48px_rgba(15,23,42,0.22)] backdrop-blur-md"
          style={{
            height: windowRect.height,
            left: windowRect.left,
            top: windowRect.top,
            width: windowRect.width,
          }}
        >
          <div
            className="absolute inset-y-4 left-0 z-10 flex w-3 cursor-col-resize touch-none items-center justify-center text-slate-300 hover:bg-cyan-50/70 hover:text-cyan-600"
            onPointerDown={event => handleInteractionStart(event, 'resize-left')}
            onPointerMove={handleInteractionMove}
            onPointerUp={handleInteractionEnd}
            onPointerCancel={handleInteractionEnd}
            title="Panel genişliğini değiştirmek için sürükleyin"
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </div>
          <div
            className="absolute inset-y-4 right-0 z-10 flex w-3 cursor-col-resize touch-none items-center justify-center text-slate-300 hover:bg-cyan-50/70 hover:text-cyan-600"
            onPointerDown={event => handleInteractionStart(event, 'resize-right')}
            onPointerMove={handleInteractionMove}
            onPointerUp={handleInteractionEnd}
            onPointerCancel={handleInteractionEnd}
            title="Panel genişliğini değiştirmek için sürükleyin"
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </div>
          <div
            className="absolute inset-x-4 top-0 z-10 h-2 cursor-row-resize touch-none"
            onPointerDown={event => handleInteractionStart(event, 'resize-top')}
            onPointerMove={handleInteractionMove}
            onPointerUp={handleInteractionEnd}
            onPointerCancel={handleInteractionEnd}
            title="Panel yüksekliğini değiştirmek için sürükleyin"
          />
          <div
            className="absolute inset-x-4 bottom-0 z-10 h-2 cursor-row-resize touch-none"
            onPointerDown={event => handleInteractionStart(event, 'resize-bottom')}
            onPointerMove={handleInteractionMove}
            onPointerUp={handleInteractionEnd}
            onPointerCancel={handleInteractionEnd}
            title="Panel yüksekliğini değiştirmek için sürükleyin"
          />
          <div
            className="absolute left-0 top-0 z-20 h-4 w-4 cursor-nwse-resize touch-none"
            onPointerDown={event => handleInteractionStart(event, 'resize-top-left')}
            onPointerMove={handleInteractionMove}
            onPointerUp={handleInteractionEnd}
            onPointerCancel={handleInteractionEnd}
            title="Paneli köşeden boyutlandırın"
          />
          <div
            className="absolute right-0 top-0 z-20 h-4 w-4 cursor-nesw-resize touch-none"
            onPointerDown={event => handleInteractionStart(event, 'resize-top-right')}
            onPointerMove={handleInteractionMove}
            onPointerUp={handleInteractionEnd}
            onPointerCancel={handleInteractionEnd}
            title="Paneli köşeden boyutlandırın"
          />
          <div
            className="absolute bottom-0 left-0 z-20 h-4 w-4 cursor-nesw-resize touch-none"
            onPointerDown={event => handleInteractionStart(event, 'resize-bottom-left')}
            onPointerMove={handleInteractionMove}
            onPointerUp={handleInteractionEnd}
            onPointerCancel={handleInteractionEnd}
            title="Paneli köşeden boyutlandırın"
          />
          <div
            className="absolute bottom-0 right-0 z-20 h-4 w-4 cursor-nwse-resize touch-none"
            onPointerDown={event => handleInteractionStart(event, 'resize-bottom-right')}
            onPointerMove={handleInteractionMove}
            onPointerUp={handleInteractionEnd}
            onPointerCancel={handleInteractionEnd}
            title="Paneli köşeden boyutlandırın"
          />
          <div
            className="flex h-5 cursor-move touch-none items-center justify-center border-b border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600"
            onPointerDown={event => handleInteractionStart(event, 'move')}
            onPointerMove={handleInteractionMove}
            onPointerUp={handleInteractionEnd}
            onPointerCancel={handleInteractionEnd}
            title="Paneli taşımak için sürükleyin"
          >
            <GripHorizontal className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">Öznitelik Tablosu</h2>
              <p className="text-xs text-slate-500">{rowData.length} satır - hücreye çift tıklayarak düzenleyin</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                onClick={handleCancelOrClose}
                className="w-8 h-8 border border-slate-200 rounded-lg inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label={isAddingColumn || selectedCount > 0 ? 'İşlemi iptal et' : 'Kapat'}
                title={isAddingColumn || selectedCount > 0 ? 'İşlemi iptal et' : 'Kapat'}
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
                rowClassRules={rowClassRules}
                rowHeight={TABLE_ROW_HEIGHT}
                headerHeight={TABLE_HEADER_HEIGHT}
                suppressMovableColumns
                animateRows={false}
                localeText={agGridTurkishLocaleText}
                onCellValueChanged={onCellValueChanged}
                onRowClicked={onRowClicked}
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
        </section>
      </div>
      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </>,
    document.body,
  )
}
