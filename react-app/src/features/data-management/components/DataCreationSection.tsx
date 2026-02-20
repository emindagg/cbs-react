import { useState } from 'react'
import toast from 'react-hot-toast'

import { useDataManagementStore } from '../store/useDataManagementStore'
import type { DataItemType, DrawMode } from '../types'

export function DataCreationSection() {
  const {
    drawMode,
    setDrawMode,
    drawPoints,
    resetDraw,
    addItem,
  } = useDataManagementStore()

  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  const toolOptions: Array<{ id: DrawMode; label: string; iconClassName: string }> = [
    { id: 'point', label: 'Nokta', iconClassName: 'fa-solid fa-location-dot' },
    { id: 'line', label: 'Çizgi', iconClassName: 'fa-solid fa-route' },
    { id: 'polygon', label: 'Alan', iconClassName: 'fa-solid fa-draw-polygon' },
  ]

  const handleToolSelect = (toolId: DrawMode) => {
    if (drawMode === toolId) {
      // Aynı araca tekrar tıklandığında iptal et
      setDrawMode('none')
      resetDraw()
      setName('')
      setDate('')
    } else {
      setDrawMode(toolId)
      setName('')
      setDate('')
    }
  }

  const handleCancel = () => {
    setDrawMode('none')
    resetDraw()
    setName('')
    setDate('')
  }

  const handleAddData = () => {
    if (!name.trim()) {
      toast.error('Lütfen bir isim girin.')
      return
    }

    let geometry: GeoJSON.Geometry | null = null

    try {
      if (drawMode === 'point' && drawPoints.length > 0) {
        geometry = { type: 'Point', coordinates: drawPoints[0] }
      } else if (drawMode === 'line' && drawPoints.length > 1) {
        geometry = { type: 'LineString', coordinates: drawPoints }
      } else if (drawMode === 'polygon' && drawPoints.length > 2) {
        geometry = { type: 'Polygon', coordinates: [[...drawPoints, drawPoints[0]]] }
      }

      if (!geometry) {
        toast.error('Lütfen harita üzerinde çizim yapın.')
        return
      }

      const dataType: DataItemType = drawMode === 'line' || drawMode === 'polygon' || drawMode === 'point'
        ? drawMode
        : 'point'

      addItem({
        name: name.trim(),
        date,
        type: dataType,
        geometry,
        properties: { createdAt: new Date().toISOString() },
      })

      resetDraw()
      setName('')
      setDate('')
      toast.success('Veri eklendi.')
    } catch {
      toast.error('Geometri oluşturulamadı.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddData()
    }
  }

  return (
    <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
          <i className="fa-solid fa-pen-ruler text-emerald-600 text-[10px]"></i>
          Veri Oluşturma
        </h3>
        {drawMode !== 'none' && (
          <button
            onClick={handleCancel}
            className="text-[11px] text-slate-400 hover:text-red-500 font-bold transition-colors"
            title="İptal Et"
          >
            İptal Et
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Segmentli Buton Grubu */}
        <div className="flex bg-zinc-100/80 p-1 rounded-lg border border-slate-200/60">
          {toolOptions.map((tool) => {
            const isActive = drawMode === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <i className={`${tool.iconClassName} text-[16px]`}></i>
                {tool.label}
              </button>
            )
          })}
        </div>

        {drawMode !== 'none' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-zinc-50 text-zinc-700 p-2 rounded-sm border border-zinc-200">
              <p className="text-[11.5px] text-zinc-700 font-medium leading-relaxed">
                {drawMode === 'point' && (
                  <span className="text-[9.75px]">
                    Haritaya tıklayarak nokta ekleyin.
                  </span>
                )}
                {drawMode === 'polygon' && (
                  <span className="text-[9.75px]">
                    Haritaya tıklayarak alan çizin. Çift tıklayarak bitirin.
                  </span>
                )}
                {drawMode === 'line' && (
                  <span className="text-[9.75px]">
                    Haritaya tıklayarak çizgi çizin. Çift tıklayarak bitirin.
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Veri Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Örn: Tarihi Müze, Hastane, Park..."
                className="w-full px-2.5 py-1.5 border border-zinc-300 bg-zinc-50 rounded-lg text-xs text-zinc-900 placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Tarih (Opsiyonel)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2.5 py-1.5 border border-zinc-300 bg-zinc-50 rounded-lg text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleAddData}
              className="w-full bg-zinc-900 hover:bg-black text-white font-medium py-1.5 px-2.5 text-xs rounded-lg transition-all flex items-center justify-center transform active:scale-95"
            >
              <i className="fa-solid fa-plus mr-2"></i>Veri Ekle
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
