import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { isStyleProperties } from '@/types/style'
import type { StyleProperties } from '@/types/style'

import { ImportedDataTableModal } from './ImportedDataTableModal'
import { useDataManagementStore } from '../store/useDataManagementStore'

const CATALOG_IMPORT_RENDER_LIMIT = 200
const COLOR_PICKER_DOUBLE_CLICK_TIMEOUT_MS = 300

export function DataCatalogSection() {
  const items = useDataManagementStore(state => state.items)
  const updateItemFillColor = useDataManagementStore(state => state.updateItemFillColor)
  const toggleVisibility = useDataManagementStore(state => state.toggleVisibility)
  const removeItem = useDataManagementStore(state => state.removeItem)
  const editingItemId = useDataManagementStore(state => state.editingItemId)
  const startEditingItem = useDataManagementStore(state => state.startEditingItem)
  const [colorPickerItemId, setColorPickerItemId] = useState<string | null>(null)
  const [colorPickerPosition, setColorPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const itemRefsRef = useRef<Record<string, HTMLDivElement>>({})
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastClickItemIdRef = useRef<string | null>(null)

  // Color picker pozisyonunu hesapla
  const updateColorPickerPosition = (itemId: string) => {
    const itemElement = itemRefsRef.current[itemId]
    if (itemElement) {
      const rect = itemElement.getBoundingClientRect()
      setColorPickerPosition({
        top: rect.bottom + 4,
        left: rect.left,
      })
    }
  }

  // Dışarı tıklayınca color picker'ı kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        const clickedItem = Object.values(itemRefsRef.current).find(el => el.contains(event.target as Node))
        if (!clickedItem) {
          setColorPickerItemId(null)
          setColorPickerPosition(null)
        }
      }
    }

    if (!colorPickerItemId) return

    updateColorPickerPosition(colorPickerItemId)
    document.addEventListener('mousedown', handleClickOutside)
    const handleResize = () => {
      if (colorPickerItemId) {
        updateColorPickerPosition(colorPickerItemId)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
    }
  }, [colorPickerItemId])

  // ESC tuşu ile kapat
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && colorPickerItemId) {
        setColorPickerItemId(null)
      }
    }

    if (colorPickerItemId) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [colorPickerItemId])
  const drawnItems = items.filter(item => item.source === 'drawn')
  const importedItems = items.filter(item => item.source === 'imported')

  const importedBySource = importedItems.reduce<Record<string, typeof importedItems>>((acc, item) => {
    const key = item.sourceLabel?.trim() || 'Bilinmeyen Kaynak'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const sourceEntries = Object.entries(importedBySource)
  const hiddenSources = sourceEntries
    .filter(([, sourceItems]) => sourceItems.length > CATALOG_IMPORT_RENDER_LIMIT)
    .map(([sourceName, sourceItems]) => ({ sourceName, count: sourceItems.length }))

  const visibleImportedItems = sourceEntries
    .filter(([, sourceItems]) => sourceItems.length <= CATALOG_IMPORT_RENDER_LIMIT)
    .flatMap(([, sourceItems]) => sourceItems)

  const visibleItems = [...drawnItems, ...visibleImportedItems]
  const isTrulyEmpty = items.length === 0
  const showHiddenInfoOnly = !isTrulyEmpty && visibleItems.length === 0 && hiddenSources.length > 0

  return (
    <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
          <i className="fa-solid fa-database text-[#18181B] text-[10px]"></i>
          Veri Kataloğu
        </h3>

        {drawnItems.length > 0 && (
          <button
            onClick={() => setIsTableModalOpen(true)}
            className="text-[10px] flex items-center gap-1 text-slate-600 hover:text-emerald-600 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            title="Çizim Verileri Öznitelik Tablosunu Aç"
          >
            <i className="fa-solid fa-table"></i>
            Tablo
          </button>
        )}
      </div>

      {hiddenSources.length > 0 && (
        <div className="mb-2 px-2 py-1.5 rounded-md border border-amber-200 bg-amber-50 text-[10px] text-amber-800">
          Performans için {hiddenSources.length} dosya gizlendi. İçerik Yönetim panelinden yönetebilirsiniz.
          <div className="mt-1 text-[9px] text-amber-700">
            {hiddenSources.map(source => `${source.sourceName} (${source.count})`).join(', ')}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-40 overflow-y-auto text-sm custom-scrollbar">
        {isTrulyEmpty ? (
          <div className="flex items-center justify-center py-8 text-zinc-400 bg-zinc-50/50 rounded-lg border-2 border-dashed border-zinc-200">
            <div className="text-center">
              <i className="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
              <p className="text-sm font-medium text-zinc-500">Henüz veri eklenmedi</p>
              <p className="text-[10px] mt-1 text-zinc-400">Haritaya tıklayarak veri eklemeye başlayın</p>
            </div>
          </div>
        ) : showHiddenInfoOnly ? (
          <div className="flex items-center justify-center py-6 text-zinc-500 bg-zinc-50 rounded-lg border border-zinc-200">
            <div className="text-center">
              <p className="text-xs font-medium">İçe aktarılan veriler katalogda gizlendi</p>
              <p className="text-[10px] mt-1 text-zinc-400">İçerik Yönetim panelinden görünürlük kontrolü yapabilirsiniz</p>
            </div>
          </div>
        ) : (
          visibleItems.map(item => {
            const rawStyle = item.properties.style
            const style: StyleProperties = isStyleProperties(rawStyle) ? rawStyle : {}
            const currentFillColor = style.fillColor || '#18181B'
            const iconColor = currentFillColor || '#94a3b8' // Fallback: gri renk

            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) itemRefsRef.current[item.id] = el
                  else delete itemRefsRef.current[item.id]
                }}
                className="relative"
              >
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-100 bg-white hover:bg-zinc-50 transition-colors cursor-pointer select-none ${!item.visible ? 'opacity-40' : ''} ${editingItemId === item.id ? 'ring-1 ring-emerald-400 border-emerald-200' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (lastClickItemIdRef.current === item.id && clickTimeoutRef.current) {
                      // Çift tıklama algılandı
                      clearTimeout(clickTimeoutRef.current)
                      clickTimeoutRef.current = null
                      lastClickItemIdRef.current = null
                      setColorPickerItemId(item.id)
                    } else {
                      // İlk tıklama
                      lastClickItemIdRef.current = item.id
                      clickTimeoutRef.current = setTimeout(() => {
                        lastClickItemIdRef.current = null
                        clickTimeoutRef.current = null
                      }, COLOR_PICKER_DOUBLE_CLICK_TIMEOUT_MS)
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (clickTimeoutRef.current) {
                      clearTimeout(clickTimeoutRef.current)
                      clickTimeoutRef.current = null
                    }
                    lastClickItemIdRef.current = null
                    setColorPickerItemId(item.id)
                  }}
                  title="Çift tıklayarak renk değiştir"
                >
                  <i
                    className={`text-[10px] ${item.type === 'point'
                        ? 'fa-solid fa-location-dot'
                        : item.type === 'line'
                          ? 'fa-solid fa-route'
                          : 'fa-solid fa-draw-polygon' // polygon ve circle (artık desteklenmiyor) için
                      }`}
                    style={{ color: iconColor }}
                    title={`Renk: ${currentFillColor || 'Varsayılan'}`}
                  ></i>
                  <span className="text-xs text-zinc-700 font-medium truncate flex-1">{item.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleVisibility(item.id)
                    }}
                    className="ml-auto shrink-0 text-[10px] transition-colors"
                    style={{ color: item.visible ? '#34d399' : '#d1d5db' }}
                    title={item.visible ? 'Gizle' : 'Göster'}
                  >
                    <i className={item.visible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'}></i>
                  </button>
                  {(item.type === 'line' || item.type === 'polygon') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditingItem(item.id)
                      }}
                      className={`shrink-0 text-[10px] transition-colors ${editingItemId === item.id ? 'text-emerald-500' : 'text-zinc-300 hover:text-emerald-500'}`}
                      title="Geometriyi düzenle"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeItem(item.id)
                    }}
                    className="shrink-0 text-[10px] text-zinc-300 hover:text-red-500 transition-colors"
                    title="Sil"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Color Picker Portal */}
      {colorPickerItemId && colorPickerPosition && (() => {
        const item = visibleItems.find(i => i.id === colorPickerItemId)
        if (!item) return null
        const rawStyle = item.properties.style
        const style: StyleProperties = isStyleProperties(rawStyle) ? rawStyle : {}
        const currentFillColor = style.fillColor || '#18181B'

        return createPortal(
          <div
            ref={colorPickerRef}
            className="fixed z-[99999] bg-white border border-zinc-200 rounded-lg shadow-xl p-3 min-w-[200px]"
            style={{
              top: `${colorPickerPosition.top}px`,
              left: `${colorPickerPosition.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-zinc-700 uppercase tracking-wide">
                Dolgu Rengi
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setColorPickerItemId(null)
                }}
                className="text-zinc-400 hover:text-zinc-600 text-xs"
                title="Kapat"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentFillColor}
                onChange={(e) => {
                  updateItemFillColor(item.id, e.target.value)
                }}
                className="w-10 h-10 border border-zinc-300 rounded-md cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={currentFillColor}
                  onChange={(e) => {
                    const color = e.target.value
                    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                      updateItemFillColor(item.id, color)
                    }
                  }}
                  className="w-full px-2 py-1 text-xs border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="#18181B"
                />
              </div>
            </div>
          </div>,
          document.body,
        )
      })()}

      <ImportedDataTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        items={items}
        sourceFilter="drawn"
      />
    </section>
  )
}

