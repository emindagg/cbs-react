import { AnimatePresence, motion } from 'framer-motion'
import {
  Boxes,
  ChevronDown,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Palette,
  Settings2,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { ImportedDataTableModal } from './ImportedDataTableModal'
import { useDataManagementStore } from '../store/useDataManagementStore'

const FAB_SIZE = 30
const FAB_MARGIN = 16
const PANEL_WIDTH = 260
const PANEL_HEIGHT = 535
const LABEL_SIZE_MIN = 8
const LABEL_SIZE_RANGE = 40

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getDefaultFabPosition() {
  return {
    x: window.innerWidth - FAB_SIZE - FAB_MARGIN,
    y: window.innerHeight - FAB_SIZE - FAB_MARGIN,
  }
}

function getPanelPosition(x: number, y: number) {
  const safeLeft = clamp(x - PANEL_WIDTH + FAB_SIZE, 12, window.innerWidth - PANEL_WIDTH - 12)
  const safeTop = clamp(y - PANEL_HEIGHT - 10, 12, window.innerHeight - PANEL_HEIGHT - 12)
  return { left: safeLeft, top: safeTop }
}

function getImportedLayerVisibility(items: ReturnType<typeof useDataManagementStore.getState>['items']) {
  const imported = items.filter(item => item.source === 'imported')
  if (imported.length === 0) return false
  return imported.some(item => item.visible)
}

export function ImportedDataManagerFab() {
  const {
    items,
    hasImportedData,
    importedLayerName,
    layerStyles,
    fabPosition,
    setFabPosition,
    updateLayerStyle,
    toggleImportedLayerVisibility,
    toggleImportedSourceVisibility,
    removeImportedLayer,
  } = useDataManagementStore()

  const [, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [themeOpen, setThemeOpen] = useState(true)
  const [labelOpen, setLabelOpen] = useState(false)

  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null)
  const hasMovedRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  const importedItems = useMemo(
    () => items.filter(item => item.source === 'imported'),
    [items],
  )
  const importedVisible = useMemo(
    () => getImportedLayerVisibility(items),
    [items],
  )

  const labelOptions = useMemo(() => {
    const keys = new Set<string>()
    importedItems.forEach((item) => {
      Object.keys(item.properties).forEach(key => keys.add(key))
    })
    return Array.from(keys)
  }, [importedItems])

  const importedSources = useMemo(() => {
    const grouped = new Map<string, { count: number; visible: boolean }>()
    importedItems.forEach((item) => {
      const key = item.sourceLabel || item.name || 'Import edilen veri'
      const current = grouped.get(key)
      if (!current) {
        grouped.set(key, { count: 1, visible: item.visible })
        return
      }
      grouped.set(key, {
        count: current.count + 1,
        visible: current.visible || item.visible,
      })
    })
    return Array.from(grouped.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      visible: data.visible,
    }))
  }, [importedItems])

  useEffect(() => {
    if (fabPosition) return
    setFabPosition(getDefaultFabPosition())
  }, [fabPosition, setFabPosition])

  const clampFabPosition = useCallback((x: number, y: number) => ({
    x: clamp(x, FAB_MARGIN, window.innerWidth - FAB_SIZE - FAB_MARGIN),
    y: clamp(y, FAB_MARGIN, window.innerHeight - FAB_SIZE - FAB_MARGIN),
  }), [])

  useEffect(() => {
    const onResize = () => {
      const current = fabPosition ?? getDefaultFabPosition()
      const next = clampFabPosition(current.x, current.y)
      if (next.x !== current.x || next.y !== current.y) {
        setFabPosition(next)
      }
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      // Cleanup pending RAF on unmount
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [fabPosition, clampFabPosition, setFabPosition])

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!fabPosition) return
    ;(event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId)
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: fabPosition.x,
      startY: fabPosition.y,
    }
    hasMovedRef.current = false
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = dragStartRef.current
    if (!start) return

    const deltaX = event.clientX - start.pointerX
    const deltaY = event.clientY - start.pointerY
    
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMovedRef.current = true
    }

    // Cancel pending RAF if exists
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      const next = clampFabPosition(start.startX + deltaX, start.startY + deltaY)
      setFabPosition(next)
      rafRef.current = null
    })
  }

  const handlePointerUp = () => {
    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    dragStartRef.current = null
    
    if (!hasMovedRef.current) {
      setIsOpen(prev => !prev)
    }
    hasMovedRef.current = false
  }

  if (!hasImportedData || !fabPosition) return null

  const panelPosition = getPanelPosition(fabPosition.x, fabPosition.y)

  return (
    <>
      <div
        className="fixed z-[1700]"
        style={{
          left: fabPosition.x,
          top: fabPosition.y,
          transform: 'translateZ(0)',
        }}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-[30px] h-[30px] rounded-full bg-slate-900 border border-slate-700 shadow-lg text-white flex items-center justify-center touch-none select-none"
          aria-label="İçerik yönetim paneli"
          title="İçerik yönetim paneli"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {hasImportedData && isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-[1690] w-[260px] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.18)] ring-1 ring-slate-100/50"
            style={{ left: panelPosition.left, top: panelPosition.top }}
          >
            <div className="px-4 py-3.5 border-b border-slate-200/80 bg-gradient-to-br from-slate-50 to-white rounded-t-xl backdrop-blur-sm">
              <div className="flex items-center gap-3 justify-between">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border border-slate-200/60 bg-white shadow-sm inline-flex items-center justify-center text-slate-700 ring-1 ring-slate-100">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                      {importedSources.length > 1
                        ? `${importedSources.length} dosya yüklü`
                        : (importedLayerName || importedItems[0]?.sourceLabel || importedItems[0]?.name || 'Import edilen veri')}
                    </p>
                    <p className="text-[10px] font-medium tracking-wide uppercase text-slate-500 mt-0.5">Geçerli Katman</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleImportedLayerVisibility}
                    className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 inline-flex items-center justify-center transition-all duration-200 active:scale-95"
                    title={importedVisible ? 'Katmanı gizle' : 'Katmanı göster'}
                  >
                    {importedVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeImportedLayer()
                      setIsOpen(false)
                    }}
                    className="w-7 h-7 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 inline-flex items-center justify-center transition-all duration-200 active:scale-95"
                    title="Katmanı sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[476px] overflow-y-auto px-3 py-3 space-y-3 bg-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              <button
                type="button"
                onClick={() => setShowTable(true)}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Öznitelik Tablosunu Aç
              </button>

              <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/50 to-white p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Yüklü Veriler</p>
                  <span className="text-xs font-bold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded-md">{importedSources.length}</span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {importedSources.map((source) => (
                    <div key={source.name} className="h-7 px-2.5 rounded-lg bg-white border border-slate-200/60 text-[11px] text-slate-700 flex items-center justify-between gap-2 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-150">
                      <span className="truncate font-medium">{source.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleImportedSourceVisibility(source.name)}
                        className="w-6 h-6 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 inline-flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95"
                        title={source.visible ? 'Bu dosyayı gizle' : 'Bu dosyayı göster'}
                      >
                        {source.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setThemeOpen(prev => !prev)}
                  className="w-full h-9 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 rounded-xl flex items-center justify-between px-3 text-xs font-semibold text-slate-800 transition-all duration-200 border border-slate-200/60 shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white inline-flex items-center justify-center shadow-sm">
                      <Palette className="w-3.5 h-3.5" />
                    </span>
                    <span>Tema Stilleri</span>
                  </span>
                  <span className={`transition-transform duration-200 ${themeOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </span>
                </button>

                {themeOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5 pl-1"
                  >
                    <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/60 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 mb-0.5">Küme Gösterimi</p>
                        </div>
                        <button
                          id="dm-cluster"
                          type="button"
                          role="switch"
                          aria-checked={layerStyles.clusterEnabled}
                          onClick={() => startTransition(() => updateLayerStyle({ clusterEnabled: !layerStyles.clusterEnabled }))}
                          className={`relative w-11 h-6 rounded-full transition-all duration-300 shadow-inner ${layerStyles.clusterEnabled ? 'bg-slate-900' : 'bg-slate-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${layerStyles.clusterEnabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="dm-opacity" className="text-xs font-semibold text-slate-800">Katman Şeffaflığı</label>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={layerStyles.opacity}
                          onChange={(event) => startTransition(() => updateLayerStyle({ opacity: Number(event.target.value) }))}
                          className="w-14 h-7 border border-slate-300 rounded-lg bg-white text-[11px] text-slate-800 text-center font-medium shadow-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                      </div>
                      <input
                        id="dm-opacity"
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={layerStyles.opacity}
                        onChange={(event) => startTransition(() => updateLayerStyle({ opacity: Number(event.target.value) }))}
                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900"
                        style={{
                          background: `linear-gradient(to right, #0f172a 0%, #0f172a ${layerStyles.opacity * 100}%, #e2e8f0 ${layerStyles.opacity * 100}%, #e2e8f0 100%)`,
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="dm-width" className="text-xs font-semibold text-slate-800">Sembol Genişliği</label>
                        <input
                          type="number"
                          min={0.5}
                          max={50}
                          step={0.5}
                          value={layerStyles.width}
                          onChange={(event) => startTransition(() => updateLayerStyle({ width: Number(event.target.value) }))}
                          className="w-14 h-7 border border-slate-300 rounded-lg bg-white text-[11px] text-slate-800 text-center font-medium shadow-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                      </div>
                      <input
                        id="dm-width"
                        type="range"
                        min={0.5}
                        max={50}
                        step={0.5}
                        value={layerStyles.width}
                        onChange={(event) => startTransition(() => updateLayerStyle({ width: Number(event.target.value) }))}
                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900"
                        style={{
                          background: `linear-gradient(to right, #0f172a 0%, #0f172a ${(layerStyles.width / 50) * 100}%, #e2e8f0 ${(layerStyles.width / 50) * 100}%, #e2e8f0 100%)`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50/50 border border-slate-200/60">
                      <label className="text-xs font-semibold text-slate-800">Dolgu Rengi</label>
                      <div className="h-9 px-2.5 border border-slate-300 rounded-lg bg-white flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow">
                        <input
                          type="color"
                          value={layerStyles.fillColor}
                          onChange={(event) => startTransition(() => updateLayerStyle({ fillColor: event.target.value }))}
                          className="w-6 h-6 border border-slate-300 rounded-md cursor-pointer"
                        />
                        <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">{layerStyles.fillColor}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="dm-stroke-width" className="text-xs font-semibold text-slate-800">Çerçeve Kalınlığı</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.5}
                          value={layerStyles.strokeWidth}
                          onChange={(event) => startTransition(() => updateLayerStyle({ strokeWidth: Number(event.target.value) }))}
                          className="w-14 h-7 border border-slate-300 rounded-lg bg-white text-[11px] text-slate-800 text-center font-medium shadow-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                      </div>
                      <input
                        id="dm-stroke-width"
                        type="range"
                        min={0}
                        max={10}
                        step={0.5}
                        value={layerStyles.strokeWidth}
                        onChange={(event) => startTransition(() => updateLayerStyle({ strokeWidth: Number(event.target.value) }))}
                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900"
                        style={{
                          background: `linear-gradient(to right, #0f172a 0%, #0f172a ${(layerStyles.strokeWidth / 10) * 100}%, #e2e8f0 ${(layerStyles.strokeWidth / 10) * 100}%, #e2e8f0 100%)`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50/50 border border-slate-200/60">
                      <label className="text-xs font-semibold text-slate-800">Çerçeve Rengi</label>
                      <div className="h-9 px-2.5 border border-slate-300 rounded-lg bg-white flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow">
                        <input
                          type="color"
                          value={layerStyles.strokeColor}
                          onChange={(event) => startTransition(() => updateLayerStyle({ strokeColor: event.target.value }))}
                          className="w-6 h-6 border border-slate-300 rounded-md cursor-pointer"
                        />
                        <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">{layerStyles.strokeColor}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setLabelOpen(prev => !prev)}
                  className="w-full h-9 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 rounded-xl flex items-center justify-between px-3 text-xs font-semibold text-slate-800 transition-all duration-200 border border-slate-200/60 shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white inline-flex items-center justify-center shadow-sm">
                      <Settings2 className="w-3.5 h-3.5" />
                    </span>
                    <span>Etiket ve Yazı</span>
                  </span>
                  <span className={`transition-transform duration-200 ${labelOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </span>
                </button>

                {labelOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5 pl-1"
                  >
                    <div className="space-y-1.5">
                      <label htmlFor="dm-label-field" className="text-xs font-semibold text-slate-800">Görüntülenecek Alan</label>
                      <select
                        id="dm-label-field"
                        value={layerStyles.labelField}
                        onChange={(event) => startTransition(() => updateLayerStyle({ labelField: event.target.value }))}
                        className="w-full h-9 px-3 border border-slate-300 bg-white rounded-lg text-[11px] text-slate-800 font-medium shadow-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                      >
                        <option value="">Seçiniz</option>
                        {labelOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="dm-text-size" className="text-xs font-semibold text-slate-800">Punto Büyüklüğü</label>
                        <input
                          type="number"
                          min={8}
                          max={48}
                          step={1}
                          value={layerStyles.textSize}
                          onChange={(event) => startTransition(() => updateLayerStyle({ textSize: Number(event.target.value) }))}
                          className="w-14 h-7 border border-slate-300 rounded-lg bg-white text-[11px] text-slate-800 text-center font-medium shadow-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                      </div>
                      <input
                        id="dm-text-size"
                        type="range"
                        min={8}
                        max={48}
                        step={1}
                        value={layerStyles.textSize}
                        onChange={(event) => startTransition(() => updateLayerStyle({ textSize: Number(event.target.value) }))}
                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900"
                        style={{
                          background: `linear-gradient(to right, #0f172a 0%, #0f172a ${((layerStyles.textSize - LABEL_SIZE_MIN) / LABEL_SIZE_RANGE) * 100}%, #e2e8f0 ${((layerStyles.textSize - LABEL_SIZE_MIN) / LABEL_SIZE_RANGE) * 100}%, #e2e8f0 100%)`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50/50 border border-slate-200/60">
                      <label className="text-xs font-semibold text-slate-800">Metin Rengi</label>
                      <div className="h-9 px-2.5 border border-slate-300 rounded-lg bg-white flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow">
                        <input
                          type="color"
                          value={layerStyles.textColor}
                          onChange={(event) => startTransition(() => updateLayerStyle({ textColor: event.target.value }))}
                          className="w-6 h-6 border border-slate-300 rounded-md cursor-pointer"
                        />
                        <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">{layerStyles.textColor}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImportedDataTableModal
        isOpen={hasImportedData && showTable}
        onClose={() => setShowTable(false)}
        items={items}
      />
    </>
  )
}
