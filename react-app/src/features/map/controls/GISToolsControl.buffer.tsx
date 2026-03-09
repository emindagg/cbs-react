/**
 * Buffer Modal – ArcGIS-style Etki Alanı Analizi
 * Çoklu katman, dissolve, tek taraflı (çizgi), çoklu mesafe. Yöntem: düzlem (planar).
 */

import type * as turf from '@turf/turf'
import { Zap } from 'lucide-react'
import { useState } from 'react'
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
    <div className="fixed inset-0 bg-black/30 z-10003 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100">
        <div className="px-4 py-3 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-tight flex items-center gap-2">
            <i className="fa-solid fa-circle-dot text-purple-500"></i>
            Etki Alanı Analizi
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">
                Katman(lar)
              </label>
              <div className="flex items-center gap-2">
                {/* Bulk / Individual toggle */}
                <div className="flex items-center rounded-md border border-zinc-200 overflow-hidden text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={switchToBulk}
                    className={`px-2 py-0.5 transition-colors ${inputMode === 'bulk' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}
                  >
                    Toplu
                  </button>
                  <button
                    type="button"
                    onClick={switchToIndividual}
                    className={`px-2 py-0.5 transition-colors ${inputMode === 'individual' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}
                  >
                    Ayrı Ayrı
                  </button>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[10px] text-purple-600 hover:text-purple-700 font-medium"
                >
                  {allSelected ? 'Seçimi Kaldır' : 'Tümünü seç'}
                </button>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto border border-zinc-200 rounded-lg p-1.5 bg-zinc-50 space-y-0.5">
              {visibleItems.length === 0 ? (
                <p className="text-[10px] text-zinc-400 px-2 py-1">Görünür katman yok</p>
              ) : (
                visibleItems.map(i => (
                  <label
                    key={i.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-100 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLayerIds.includes(i.id)}
                      onChange={() => toggleLayer(i.id)}
                      className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 shrink-0"
                    />
                    <span className="truncate flex-1">{i.name}</span>
                    {inputMode === 'individual' && (
                      <input
                        type="text"
                        value={layerDistances[i.id] ?? ''}
                        onChange={e => setLayerDistances(prev => ({ ...prev, [i.id]: e.target.value }))}
                        onClick={e => e.stopPropagation()}
                        className="w-20 h-6 px-1.5 bg-white border border-zinc-300 rounded text-[10px] focus:ring-1 focus:ring-purple-500 outline-hidden shrink-0"
                        placeholder="500"
                      />
                    )}
                  </label>
                ))
              )}
            </div>
            {inputMode === 'bulk' && selectedLayerIds.length > 1 && (
              <p className="text-[9px] text-zinc-500">
                {willAnalyzeCount} katman seçili — hepsi aynı mesafe ile buffer'lanacak
              </p>
            )}
            {inputMode === 'individual' && selectedLayerIds.length > 0 && (
              <p className="text-[9px] text-zinc-500">
                {selectedLayerIds.length} katman seçili
                {filledCount < selectedLayerIds.length && ` — ${selectedLayerIds.length - filledCount} tanesi varsayılan mesafe kullanacak`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">
                {inputMode === 'individual' ? 'Varsayılan mesafe' : 'Mesafe'}
              </label>
              <input
                type="number"
                value={bufferRadius}
                onChange={e => setBufferRadius(Number(e.target.value))}
                className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
                placeholder="Poligonda negatif = içe"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Birim</label>
              <select
                value={bufferUnit}
                onChange={e => setBufferUnit(e.target.value as turf.Units)}
                className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
              >
                <option value="meters">Metre</option>
                <option value="kilometers">Kilometre</option>
              </select>
            </div>
          </div>

          {inputMode === 'bulk' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Çoklu mesafe</label>
              <input
                type="text"
                value={multiDistances}
                onChange={e => setMultiDistances(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
                placeholder="Örn: 100, 200, 500"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Taraf</label>
            <select
              value={sideType}
              onChange={e => setSideType(e.target.value as BufferSideType)}
              className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
            >
              {SIDE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Birleştir</label>
            <select
              value={dissolve}
              onChange={e => setDissolve(e.target.value as BufferDissolve)}
              className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
            >
              {DISSOLVE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3 bg-zinc-50/50 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-8 text-xs font-medium text-zinc-500 hover:bg-zinc-200 rounded-lg transition-colors"
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
