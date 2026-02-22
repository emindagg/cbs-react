/**
 * Buffer Modal – ArcGIS-style Etki Alanı Analizi
 * Çoklu katman, dissolve, tek taraflı (çizgi), çoklu mesafe. Yöntem: düzlem (planar).
 */

import * as turf from '@turf/turf'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'
import {
  runBufferAnalysis,
  runBufferAnalysisForMultipleGeometries,
  runMultiRingBuffer,
  type BufferDissolve,
  type BufferSideType,
} from '../utils/bufferAnalysis'
import { BUFFER_MODE_COLORS } from './GISToolsControl.bufferColors'

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

export function BufferModal({ isOpen, onClose }: BufferModalProps) {
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([])
  const [bufferRadius, setBufferRadius] = useState(500)
  const [bufferUnit, setBufferUnit] = useState<turf.Units>('meters')
  const [dissolve, setDissolve] = useState<BufferDissolve>('none')
  const [sideType, setSideType] = useState<BufferSideType>('full')
  const [multiDistances, setMultiDistances] = useState('')
  const { items, addItem } = useDataManagementStore()

  if (!isOpen) return null

  const toggleLayer = (id: string) => {
    setSelectedLayerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAllLayers = () => {
    const visible = items.filter(i => i.visible).map(i => i.id)
    setSelectedLayerIds(visible)
  }

  const handleBufferAnalyze = () => {
    if (selectedLayerIds.length === 0) return
    const selectedItems = items.filter(i => selectedLayerIds.includes(i.id) && i.geometry)
    if (selectedItems.length === 0) return

    const distances: number[] = []
    if (multiDistances.trim()) {
      const parts = multiDistances
        .split(/[,\s]+/)
        .map(s => Number(s.trim()))
        .filter(n => !Number.isNaN(n) && n !== 0)
      if (parts.length > 0) distances.push(...parts)
    }
    if (distances.length === 0) distances.push(bufferRadius)

    const options = {
      units: bufferUnit,
      dissolve,
      sideType,
    }

    const baseName =
      selectedItems.length === 1
        ? selectedItems[0].name
        : `${selectedItems.length} katman`

    try {
      if (distances.length === 1) {
        const geom =
          selectedItems.length === 1
            ? runBufferAnalysis(selectedItems[0].geometry, { ...options, distance: distances[0] })
            : runBufferAnalysisForMultipleGeometries(
                selectedItems.map(i => i.geometry),
                { ...options, distance: distances[0] }
              )
        if (geom) {
          addItem({
            name: `Buffer(${distances[0]} ${bufferUnit}) - ${baseName}`,
            date: new Date().toISOString(),
            type: 'polygon',
            geometry: geom,
            properties: {
              analysis: 'buffer',
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
                    { ...options, distance: d }
                  )
                )
                .filter((g): g is NonNullable<typeof g> => g != null)
        if (geoms.length === 0) {
          toast.error('Hiçbir buffer oluşturulamadı.')
          return
        }
        geoms.forEach((geom, i) => {
          addItem({
            name: `Buffer(${distances[i]} ${bufferUnit}) - ${baseName}`,
            date: new Date().toISOString(),
            type: 'polygon',
            geometry: geom,
            properties: {
              analysis: 'buffer',
              dissolve,
              sideType,
              style: { fillColor: BUFFER_MODE_COLORS.normal },
            },
          })
        })
        onClose()
      }
    } catch (e) {
      console.error(e)
      toast.error('Buffer analizi sırasında hata oluştu.')
    }
  }

  const visibleItems = items.filter(i => i.visible)
  const hasSelection = selectedLayerIds.length > 0

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
                Katman(lar) — çoklu seçim
              </label>
              <button
                type="button"
                onClick={selectAllLayers}
                className="text-[10px] text-purple-600 hover:text-purple-700 font-medium"
              >
                Tümünü seç
              </button>
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
                      className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="truncate">{i.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedLayerIds.length > 1 && (
              <p className="text-[9px] text-zinc-500">
                {selectedLayerIds.length} katman seçili — hepsi aynı mesafe ile buffer'lanacak
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Mesafe</label>
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

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Çoklu mesafe (opsiyonel)</label>
            <input
              type="text"
              value={multiDistances}
              onChange={e => setMultiDistances(e.target.value)}
              className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
              placeholder="Örn: 100, 200, 500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Taraf (çizgi için)</label>
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
            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Birleştir (dissolve)</label>
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
            className="flex-2 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 transition-all"
          >
            Analiz Yap
          </button>
        </div>
      </div>
    </div>
  )
}
