import { AnimatePresence, motion } from 'framer-motion'
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Palette,
  Settings2,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ImportedDataTableModal } from './ImportedDataTableModal'
import { useDataManagementStore } from '../store/useDataManagementStore'

const FAB_SIZE = 30
const FAB_MARGIN = 16
const PANEL_WIDTH = 245
const PANEL_HEIGHT = 535

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
    removeImportedLayer,
  } = useDataManagementStore()

  const [isOpen, setIsOpen] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [themeOpen, setThemeOpen] = useState(true)
  const [labelOpen, setLabelOpen] = useState(false)

  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null)
  const hasMovedRef = useRef(false)

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
    return () => window.removeEventListener('resize', onResize)
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

    const next = clampFabPosition(start.startX + deltaX, start.startY + deltaY)
    setFabPosition(next)
  }

  const handlePointerUp = () => {
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
      <div className="fixed z-[1700]" style={{ left: fabPosition.x, top: fabPosition.y }}>
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-[30px] h-[30px] rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 shadow-lg text-white flex items-center justify-center touch-none select-none transition-colors"
          aria-label="Icerik yonetim paneli"
          title="Icerik yonetim paneli"
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
            className="fixed z-[1690] w-[245px] bg-white border border-slate-200 rounded-xl shadow-[0_8px_20px_rgba(15,23,42,0.14)]"
            style={{ left: panelPosition.left, top: panelPosition.top }}
          >
            <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-3 justify-between">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-slate-200 bg-white inline-flex items-center justify-center text-slate-600">
                    <Boxes className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-900 truncate">{importedLayerName || importedItems[0]?.name || 'Import edilen veri'}</p>
                    <p className="text-[9px] font-semibold tracking-wide uppercase text-slate-500">Gecerli Katman</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleImportedLayerVisibility}
                    className="w-6 h-6 rounded-md text-slate-600 hover:bg-slate-200 inline-flex items-center justify-center"
                    title={importedVisible ? 'Katmani gizle' : 'Katmani goster'}
                  >
                    {importedVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Import edilen katman tamamen silinsin mi?')) {
                        removeImportedLayer()
                        setIsOpen(false)
                      }
                    }}
                    className="w-6 h-6 rounded-md text-slate-500 hover:bg-slate-200 inline-flex items-center justify-center"
                    title="Katmani sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[476px] overflow-y-auto px-2.5 py-2.5 space-y-2.5 bg-white">
              <button
                type="button"
                onClick={() => setShowTable(true)}
                className="w-full h-9 rounded-lg bg-black hover:bg-slate-900 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Oznitelik Tablosunu Ac
              </button>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setThemeOpen(prev => !prev)}
                  className="w-full h-8 bg-transparent flex items-center justify-between text-xs font-semibold text-slate-800"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-black text-white inline-flex items-center justify-center">
                      <Palette className="w-3 h-3" />
                    </span>
                    Tema Stilleri
                  </span>
                  {themeOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {themeOpen && (
                  <div className="space-y-3">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Kume Gosterimi</p>
                          <p className="text-[10px] text-slate-500">Noktalar yaklastikca birlestir</p>
                        </div>
                        <button
                          id="dm-cluster"
                          type="button"
                          role="switch"
                          aria-checked={layerStyles.clusterEnabled}
                          onClick={() => updateLayerStyle({ clusterEnabled: !layerStyles.clusterEnabled })}
                          className={`w-10 h-6 rounded-full transition-colors ${layerStyles.clusterEnabled ? 'bg-black' : 'bg-slate-300'}`}
                        >
                          <span className={`block w-5 h-5 mt-[2px] rounded-full bg-white transition-transform ${layerStyles.clusterEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}></span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="dm-opacity" className="text-xs font-semibold text-slate-800">Katman Seffafligi</label>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={layerStyles.opacity}
                          onChange={(event) => updateLayerStyle({ opacity: Number(event.target.value) })}
                          className="w-12 h-7 border border-slate-300 rounded-md bg-white text-[10px] text-slate-800 text-center"
                        />
                      </div>
                      <input
                        id="dm-opacity"
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={layerStyles.opacity}
                        onChange={(event) => updateLayerStyle({ opacity: Number(event.target.value) })}
                        className="w-full accent-black"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="dm-width" className="text-xs font-semibold text-slate-800">Sembol Genisligi</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          step={1}
                          value={layerStyles.width}
                          onChange={(event) => updateLayerStyle({ width: Number(event.target.value) })}
                          className="w-12 h-7 border border-slate-300 rounded-md bg-white text-[10px] text-slate-800 text-center"
                        />
                      </div>
                      <input
                        id="dm-width"
                        type="range"
                        min={1}
                        max={50}
                        step={1}
                        value={layerStyles.width}
                        onChange={(event) => updateLayerStyle({ width: Number(event.target.value) })}
                        className="w-full accent-black"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-semibold text-slate-800">Dolgu Rengi</label>
                      <div className="h-8 px-2 border border-slate-300 rounded-md bg-white flex items-center gap-1.5">
                        <input
                          type="color"
                          value={layerStyles.fillColor}
                          onChange={(event) => updateLayerStyle({ fillColor: event.target.value })}
                          className="w-5 h-5 border border-slate-300 rounded cursor-pointer"
                        />
                        <span className="text-[10px] font-medium text-slate-700 uppercase">{layerStyles.fillColor}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="dm-stroke-width" className="text-xs font-semibold text-slate-800">Cerceve Kalinligi</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={1}
                          value={layerStyles.strokeWidth}
                          onChange={(event) => updateLayerStyle({ strokeWidth: Number(event.target.value) })}
                          className="w-12 h-7 border border-slate-300 rounded-md bg-white text-[10px] text-slate-800 text-center"
                        />
                      </div>
                      <input
                        id="dm-stroke-width"
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={layerStyles.strokeWidth}
                        onChange={(event) => updateLayerStyle({ strokeWidth: Number(event.target.value) })}
                        className="w-full accent-black"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-semibold text-slate-800">Cerceve Rengi</label>
                      <div className="h-8 px-2 border border-slate-300 rounded-md bg-white flex items-center gap-1.5">
                        <input
                          type="color"
                          value={layerStyles.strokeColor}
                          onChange={(event) => updateLayerStyle({ strokeColor: event.target.value })}
                          className="w-5 h-5 border border-slate-300 rounded cursor-pointer"
                        />
                        <span className="text-[10px] font-medium text-slate-700 uppercase">{layerStyles.strokeColor}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setLabelOpen(prev => !prev)}
                  className="w-full h-8 bg-transparent flex items-center justify-between text-xs font-semibold text-slate-800"
                >
                  <span>Etiket ve Yazi</span>
                  {labelOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {labelOpen && (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="dm-label-field" className="text-xs font-semibold text-slate-800">Goruntulenecek Alan</label>
                      <select
                        id="dm-label-field"
                        value={layerStyles.labelField}
                        onChange={(event) => updateLayerStyle({ labelField: event.target.value })}
                        className="mt-1 w-full h-8 px-2 border border-slate-300 bg-white rounded-md text-[10px] text-slate-800"
                      >
                        <option value="">Seciniz</option>
                        {labelOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="dm-text-size" className="text-xs font-semibold text-slate-800">Punto Buyuklugu</label>
                        <input
                          type="number"
                          min={8}
                          max={48}
                          step={1}
                          value={layerStyles.textSize}
                          onChange={(event) => updateLayerStyle({ textSize: Number(event.target.value) })}
                          className="w-12 h-7 border border-slate-300 rounded-md bg-white text-[10px] text-slate-800 text-center"
                        />
                      </div>
                      <input
                        id="dm-text-size"
                        type="range"
                        min={8}
                        max={48}
                        step={1}
                        value={layerStyles.textSize}
                        onChange={(event) => updateLayerStyle({ textSize: Number(event.target.value) })}
                        className="w-full accent-black"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-semibold text-slate-800">Metin Rengi</label>
                      <div className="h-8 px-2 border border-slate-300 rounded-md bg-white flex items-center gap-1.5">
                        <input
                          type="color"
                          value={layerStyles.textColor}
                          onChange={(event) => updateLayerStyle({ textColor: event.target.value })}
                          className="w-5 h-5 border border-slate-300 rounded cursor-pointer"
                        />
                        <span className="text-[10px] font-medium text-slate-700 uppercase">{layerStyles.textColor}</span>
                      </div>
                    </div>
                  </div>
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
