/**
 * Buffer Modal – ArcGIS-style Etki Alanı Analizi
 * Çoklu katman, dissolve, tek taraflı (çizgi), çoklu mesafe. Yöntem: düzlem (planar).
 */

import type * as turf from '@turf/turf'
import { Check, ChevronDown, Zap } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useDataManagementStore } from '@/features/data-management'

import { BUFFER_MODE_COLORS } from './GISToolsControl.bufferColors'
import {
  runBufferAnalysis,
  runBufferAnalysisForMultipleGeometries,
  runMultiRingBuffer,
  type BufferDissolve,
  type BufferSideType,
} from '../utils/bufferAnalysis'

interface BufferModalProps {
  isOpen: boolean
  onClose: () => void
}

const DISSOLVE_OPTIONS: { value: BufferDissolve; label: string }[] = [
  { value: 'none', label: 'Hayır' },
  { value: 'all', label: 'Tümünü birleştir' },
]

const SIDE_OPTIONS: { value: BufferSideType; label: string }[] = [
  { value: 'full', label: 'Tam (her iki taraf)' },
  { value: 'left', label: 'Sol (çizgi için)' },
  { value: 'right', label: 'Sağ (çizgi için)' },
]

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  const handleOpen = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect())
    setOpen(p => !p)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(t) &&
        dropdownRef.current && !dropdownRef.current.contains(t)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`w-full h-8 px-3 flex items-center justify-between bg-zinc-50 border rounded-xl text-[11px] text-zinc-800 transition-all outline-hidden ${
          open ? 'border-zinc-400 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'
        }`}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={12} className={`text-zinc-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && rect && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 99999,
          }}
          className="bg-white border border-zinc-200/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.10)] animate-in fade-in zoom-in-95 duration-100 p-1"
        >
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                o.value === value
                  ? 'bg-zinc-900 text-white font-medium'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span>{o.label}</span>
              {o.value === value && <Check size={10} className="text-zinc-300" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

const parseDistances = (raw: string): number[] =>
  raw.split(/[,\s]+/).map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0)

export function BufferModal({ isOpen, onClose }: BufferModalProps) {
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([])
  const [bufferRadius, setBufferRadius] = useState(500)
  const [bufferUnit, setBufferUnit] = useState<turf.Units>('meters')
  const [dissolve, setDissolve] = useState<BufferDissolve>('none')
  const [sideType, setSideType] = useState<BufferSideType>('full')
  const [multiDistances, setMultiDistances] = useState('')
  const [inputMode, setInputMode] = useState<'bulk' | 'individual'>('bulk')
  const [layerDistances, setLayerDistances] = useState<Record<string, string>>({})
  const { items, addItem } = useDataManagementStore()

  if (!isOpen) return null

  const visibleItems = items.filter(i => i.visible)
  const visibleLayerIds = visibleItems.map(i => i.id)
  const allSelected = visibleLayerIds.length > 0 && visibleLayerIds.every(id => selectedLayerIds.includes(id))
  const hasSelection = selectedLayerIds.length > 0

  const toggleLayer = (id: string) => {
    setSelectedLayerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedLayerIds([])
    } else {
      setSelectedLayerIds(visibleLayerIds)
    }
  }

  const switchToIndividual = () => {
    const bulkValue = multiDistances.trim() || String(bufferRadius)
    const initial: Record<string, string> = {}
    visibleItems.forEach(i => { initial[i.id] = bulkValue })
    setLayerDistances(initial)
    setInputMode('individual')
  }

  const switchToBulk = () => setInputMode('bulk')

  const handleBufferAnalyze = () => {
    if (selectedLayerIds.length === 0) return
    const selectedItems = items.filter(i => selectedLayerIds.includes(i.id) && i.geometry)
    if (selectedItems.length === 0) return

    const options = { units: bufferUnit, dissolve, sideType }

    try {
      if (inputMode === 'bulk') {
        const distances: number[] = []
        if (multiDistances.trim()) {
          const parts = parseDistances(multiDistances)
          if (parts.length > 0) distances.push(...parts)
        }
        if (distances.length === 0) distances.push(bufferRadius)

        const baseName =
          selectedItems.length === 1
            ? selectedItems[0].name
            : `${selectedItems.length} katman`
        const sourceLayerNames = selectedItems.map(item => item.name)

        if (distances.length === 1) {
          const geom =
            selectedItems.length === 1
              ? runBufferAnalysis(selectedItems[0].geometry, { ...options, distance: distances[0] })
              : runBufferAnalysisForMultipleGeometries(
                selectedItems.map(i => i.geometry),
                { ...options, distance: distances[0] },
              )
          if (geom) {
            addItem({
              name: `Buffer(${distances[0]} ${bufferUnit}) - ${baseName}`,
              date: new Date().toISOString(),
              type: 'polygon',
              geometry: geom,
              properties: {
                analysis: 'buffer',
                bufferDistance: distances[0],
                bufferUnit,
                bufferSourceNames: sourceLayerNames,
                dissolve,
                sideType,
                style: { fillColor: BUFFER_MODE_COLORS.normal },
              },
            })
            onClose()
          } else {
            toast.error('Buffer oluşturulamadı (mesafe veya geometri uygun değil).')
          }
        } else {
          const geoms =
            selectedItems.length === 1
              ? runMultiRingBuffer(selectedItems[0].geometry, distances, options)
              : distances
                .map(d =>
                  runBufferAnalysisForMultipleGeometries(
                    selectedItems.map(i => i.geometry),
                    { ...options, distance: d },
                  ),
                )
                .filter((g): g is NonNullable<typeof g> => g !== null && g !== undefined)
          if (geoms.length === 0) {
            toast.error('Hiçbir buffer oluşturulamadı.')
            return
          }
          const sourceLayerNamesMulti = selectedItems.map(item => item.name)
          geoms.forEach((geom, i) => {
            addItem({
              name: `Buffer(${distances[i]} ${bufferUnit}) - ${baseName}`,
              date: new Date().toISOString(),
              type: 'polygon',
              geometry: geom,
              properties: {
                analysis: 'buffer',
                bufferDistance: distances[i],
                bufferUnit,
                bufferSourceNames: sourceLayerNamesMulti,
                dissolve,
                sideType,
                style: { fillColor: BUFFER_MODE_COLORS.normal },
              },
            })
          })
          onClose()
        }
      } else {
        // Individual mode: each layer processed independently
        let anySuccess = false
        for (const item of selectedItems) {
          const rawDist = layerDistances[item.id] ?? ''
          const distances = parseDistances(rawDist)
          const effectiveDistances = distances.length > 0 ? distances : [bufferRadius]

          if (effectiveDistances.length === 1) {
            const geom = runBufferAnalysis(item.geometry, { ...options, distance: effectiveDistances[0] })
            if (geom) {
              addItem({
                name: `Buffer(${effectiveDistances[0]} ${bufferUnit}) - ${item.name}`,
                date: new Date().toISOString(),
                type: 'polygon',
                geometry: geom,
                properties: {
                  analysis: 'buffer',
                  bufferDistance: effectiveDistances[0],
                  bufferUnit,
                  bufferSourceNames: [item.name],
                  dissolve,
                  sideType,
                  style: { fillColor: BUFFER_MODE_COLORS.normal },
                },
              })
              anySuccess = true
            }
          } else {
            const geoms = runMultiRingBuffer(item.geometry, effectiveDistances, options)
            if (geoms.length > 0) {
              geoms.forEach((geom, i) => {
                addItem({
                  name: `Buffer(${effectiveDistances[i]} ${bufferUnit}) - ${item.name}`,
                  date: new Date().toISOString(),
                  type: 'polygon',
                  geometry: geom,
                  properties: {
                    analysis: 'buffer',
                    bufferDistance: effectiveDistances[i],
                    bufferUnit,
                    bufferSourceNames: [item.name],
                    dissolve,
                    sideType,
                    style: { fillColor: BUFFER_MODE_COLORS.normal },
                  },
                })
              })
              anySuccess = true
            }
          }
        }
        if (!anySuccess) {
          toast.error('Hiçbir buffer oluşturulamadı.')
          return
        }
        onClose()
      }
    } catch {
      toast.error('Buffer analizi sırasında hata oluştu.')
    }
  }

  // Count how many selected layers have a non-empty distance input in individual mode
  const filledCount = selectedLayerIds.filter(id => {
    const raw = layerDistances[id] ?? ''
    return parseDistances(raw).length > 0
  }).length
  const willAnalyzeCount = inputMode === 'individual'
    ? selectedLayerIds.length // all selected layers (empty → fallback to bufferRadius)
    : selectedLayerIds.length

  return (
    <div className="fixed inset-0 bg-black/20 z-10003 flex items-center justify-center p-4 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-150 border border-zinc-200/80 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_20px_60px_rgba(0,0,0,0.10)]">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-zinc-900 tracking-[-0.02em]">
            Etki Alanı Analizi
          </h3>
          <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
            <i className="fa-solid fa-xmark text-[11px]"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e4e4e7 transparent' }}>

          {/* Katmanlar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                Katman(lar)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-zinc-200 overflow-hidden text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={switchToBulk}
                    className={`px-2.5 py-1 transition-colors ${inputMode === 'bulk' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
                  >
                    Toplu
                  </button>
                  <button
                    type="button"
                    onClick={switchToIndividual}
                    className={`px-2.5 py-1 transition-colors ${inputMode === 'individual' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
                  >
                    Ayrı Ayrı
                  </button>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[10px] text-violet-600 hover:text-violet-700 font-medium transition-colors"
                >
                  {allSelected ? 'Seçimi Kaldır' : 'Tümünü seç'}
                </button>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto border border-zinc-200/80 rounded-xl p-1.5 bg-zinc-50/60 space-y-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e4e4e7 transparent' }}>
              {visibleItems.length === 0 ? (
                <p className="text-[10px] text-zinc-400 px-2 py-1">Görünür katman yok</p>
              ) : (
                visibleItems.map(i => (
                  <label
                    key={i.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLayerIds.includes(i.id)}
                      onChange={() => toggleLayer(i.id)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0"
                    />
                    <span className="truncate flex-1 text-[11px] text-zinc-700 font-medium">{i.name}</span>
                    {inputMode === 'individual' && (
                      <input
                        type="text"
                        value={layerDistances[i.id] ?? ''}
                        onChange={e => setLayerDistances(prev => ({ ...prev, [i.id]: e.target.value }))}
                        onClick={e => e.stopPropagation()}
                        className="w-20 h-6 px-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] focus:ring-1 focus:ring-zinc-900 outline-hidden shrink-0"
                        placeholder="500"
                      />
                    )}
                  </label>
                ))
              )}
            </div>
            {inputMode === 'bulk' && selectedLayerIds.length > 1 && (
              <p className="text-[10px] text-zinc-400 px-0.5">
                {willAnalyzeCount} katman seçili — hepsi aynı mesafe ile buffer'lanacak
              </p>
            )}
            {inputMode === 'individual' && selectedLayerIds.length > 0 && (
              <p className="text-[10px] text-zinc-400 px-0.5">
                {selectedLayerIds.length} katman seçili
                {filledCount < selectedLayerIds.length && ` — ${selectedLayerIds.length - filledCount} tanesi varsayılan mesafe kullanacak`}
              </p>
            )}
          </div>

          {/* Mesafe + Birim */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                {inputMode === 'individual' ? 'Varsayılan' : 'Mesafe'}
              </label>
              <input
                type="number"
                value={bufferRadius}
                onChange={e => setBufferRadius(Number(e.target.value))}
                className="w-full h-8 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] text-zinc-800 focus:ring-1 focus:ring-zinc-900 focus:border-zinc-400 outline-hidden transition-colors"
                placeholder="500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Birim</label>
              <CustomSelect
                value={bufferUnit as string}
                onChange={v => setBufferUnit(v as turf.Units)}
                options={[
                  { value: 'meters', label: 'Metre' },
                  { value: 'kilometers', label: 'Kilometre' },
                ]}
              />
            </div>
          </div>

          {/* Çoklu mesafe */}
          {inputMode === 'bulk' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Çoklu Mesafe</label>
              <input
                type="text"
                value={multiDistances}
                onChange={e => setMultiDistances(e.target.value)}
                className="w-full h-8 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] text-zinc-800 focus:ring-1 focus:ring-zinc-900 focus:border-zinc-400 outline-hidden transition-colors"
                placeholder="Örn: 100, 200, 500"
              />
            </div>
          )}

          {/* Taraf */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Taraf</label>
            <CustomSelect
              value={sideType}
              onChange={v => setSideType(v as BufferSideType)}
              options={SIDE_OPTIONS}
            />
          </div>

          {/* Birleştir */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Birleştir</label>
            <CustomSelect
              value={dissolve}
              onChange={v => setDissolve(v as BufferDissolve)}
              options={DISSOLVE_OPTIONS}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-8 text-[11px] font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleBufferAnalyze}
            disabled={!hasSelection}
            className="flex items-center gap-1.5 px-4 h-8 text-[11.5px] font-medium text-white bg-zinc-800 hover:bg-zinc-900 rounded-lg active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Zap size={12} className="text-purple-400" />
            <span>Analizi Başlat</span>
          </button>
        </div>

      </div>
    </div>
  )
}
