/**
 * Buffer Modal Component
 * Separated from GISToolsControl for better organization
 */

import * as turf from '@turf/turf'
import type { Geometry, GeometryCollection } from 'geojson'
import { useState } from 'react'

import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'

interface BufferModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BufferModal({ isOpen, onClose }: BufferModalProps) {
  const [selectedLayerId, setSelectedLayerId] = useState('')
  const [bufferRadius, setBufferRadius] = useState(500)
  const [bufferUnit, setBufferUnit] = useState<turf.Units>('meters')
  const { items, addItem } = useDataManagementStore()

  if (!isOpen) return null

  const handleBufferAnalyze = () => {
    if (!selectedLayerId) return
    const selectedItem = items.find(i => i.id === selectedLayerId)
    if (!selectedItem || !selectedItem.geometry) return
    try {
      const buffered = turf.buffer(selectedItem.geometry as Exclude<Geometry, GeometryCollection>, bufferRadius, { units: bufferUnit })
      if (buffered) {
        addItem({
          name: `Buffer(${bufferRadius} ${bufferUnit}) - ${selectedItem.name} `,
          date: new Date().toISOString(),
          type: 'polygon',
          geometry: buffered.geometry,
          properties: { analysis: 'buffer' },
        })
        onClose()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-10003 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[300px] overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100">
        <div className="px-4 py-3 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-tight flex items-center gap-2">
            <i className="fa-solid fa-circle-dot text-purple-500"></i>
            Etki Alanı Analizi
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Katman</label>
            <select
              className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden transition-all"
              value={selectedLayerId}
              onChange={e => setSelectedLayerId(e.target.value)}
            >
              <option value="">Seçiniz</option>
              {items.filter(i => i.visible).map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Mesafe</label>
              <input
                type="number"
                value={bufferRadius}
                onChange={e => setBufferRadius(Number(e.target.value))}
                className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
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
            disabled={!selectedLayerId}
            className="flex-2 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 transition-all"
          >
            Analiz Yap
          </button>
        </div>
      </div>
    </div>
  )
}
