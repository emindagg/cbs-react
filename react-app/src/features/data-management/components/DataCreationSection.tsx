import { useState } from 'react'
import toast from 'react-hot-toast'

import { useDataManagementStore } from '../store/useDataManagementStore'
import type { DataItemType, DrawMode } from '../types'

const toolOptions: Array<{ id: DrawMode; label: string; icon: string }> = [
  { id: 'point',   label: 'Nokta', icon: 'fa-location-dot' },
  { id: 'line',    label: 'Çizgi', icon: 'fa-route' },
  { id: 'polygon', label: 'Alan',  icon: 'fa-draw-polygon' },
]

export function DataCreationSection() {
  const {
    drawMode,
    isDrawing,
    setDrawMode,
    drawPoints,
    drawUndoStack,
    drawRedoStack,
    undoDraw,
    redoDraw,
    resetDraw,
    addItem,
  } = useDataManagementStore()

  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  const isEditing =
    !isDrawing &&
    (drawMode === 'line' || drawMode === 'polygon') &&
    drawPoints.length >= 2

  const handleToolSelect = (toolId: DrawMode) => {
    if (drawMode === toolId) {
      setDrawMode('none')
      resetDraw()
    } else {
      setDrawMode(toolId)
    }
    setName('')
    setDate('')
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

      const dataType: DataItemType =
        drawMode === 'line' || drawMode === 'polygon' || drawMode === 'point'
          ? drawMode : 'point'

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

  const canUndo = drawUndoStack.length > 0 && drawMode !== 'none'
  const canRedo = drawRedoStack.length > 0 && drawMode !== 'none'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddData()
    }
  }

  return (
    <section className="px-2.5 py-2">

      {/* ── Başlık ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <i className="fa-solid fa-pen-ruler shrink-0 text-[#1c1c1e] text-[10px]" aria-hidden />
          <span className="text-[9.5px] font-semibold tracking-[0.12em] uppercase text-[#1c1c1e] select-none truncate">
            Veri Oluşturma
          </span>
        </div>
        {drawMode !== 'none' && (
          <button
            onClick={handleCancel}
            className="text-[10.5px] font-semibold text-rose-500 hover:text-rose-700 transition-colors duration-150 tracking-wide"
          >
            iptal
          </button>
        )}
      </div>

      {/* ── Segment control — ince border, slate ── */}
      <div
        className="flex rounded-md overflow-hidden"
        style={{ border: '1px solid #e2e8f0' }}
      >
        {toolOptions.map((tool, i) => {
          const active = drawMode === tool.id
          return (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 py-[7px] text-[11.5px] font-medium transition-colors duration-150 select-none',
                i > 0 ? 'border-l border-slate-200' : '',
                active
                  ? 'bg-brand-chrome text-white hover:bg-brand-chrome-hover'
                  : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              <i className={`fa-solid ${tool.icon} text-[11px]`} />
              {tool.label}
            </button>
          )
        })}
      </div>

      {/* ── Aktif form ── */}
      {drawMode !== 'none' && (
        <div className="mt-3 space-y-2.5 animate-in fade-in duration-150">

          {/* Durum satırı */}
          {(drawMode === 'line' || drawMode === 'polygon' || drawMode === 'point') && (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={undoDraw}
                disabled={!canUndo}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-rotate-left text-[10px]" aria-hidden />
                Geri Al
              </button>
              <button
                type="button"
                onClick={redoDraw}
                disabled={!canRedo}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-rotate-right text-[10px]" aria-hidden />
                İleri Al
              </button>
            </div>
          )}

          {isEditing ? (
            <div
              className="flex items-center gap-2 px-2.5 py-2 rounded-md"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              {/* Küçük slate dot — marka dili ile tutarlı */}
              <span
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{ background: '#334155' }}
              />
              <p className="text-[10px] text-slate-500 leading-snug">
                Köşeleri sürükleyerek şekli düzenleyin.
              </p>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 px-2.5 py-2 rounded-md"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              <span
                className="w-[5px] h-[5px] rounded-full shrink-0 opacity-40"
                style={{ background: '#334155' }}
              />
              <p className="text-[10px] text-slate-400 leading-snug">
                {drawMode === 'point'   && 'Haritaya tıklayarak nokta ekleyin.'}
                {drawMode === 'line'    && 'Tıklayın, çizgi oluşturun. Çift tık ile bitirin.'}
                {drawMode === 'polygon' && 'Tıklayın, alan çizin. Çift tık ile kapatın.'}
              </p>
            </div>
          )}

          {/* Ad */}
          <div>
            <label className="block text-[9.5px] font-semibold tracking-[0.08em] uppercase text-slate-400 mb-1.5">
              Ad
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Örn: Orman Sınırı, Yol Güzergahı…"
              className="w-full px-2.5 py-[7px] rounded-md text-[11.5px] text-slate-700 placeholder-slate-300 outline-none transition-all duration-150"
              style={{ border: '1px solid #e2e8f0', background: '#fff' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#94a3b8' }}
              onBlur={e  => { e.currentTarget.style.borderColor = '#e2e8f0' }}
            />
          </div>

          {/* Tarih */}
          <div>
            <label className="block text-[9.5px] font-semibold tracking-[0.08em] uppercase text-slate-400 mb-1.5">
              Tarih <span className="normal-case tracking-normal font-normal text-slate-300">— opsiyonel</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-2.5 py-[7px] rounded-md text-[11.5px] text-slate-600 outline-none transition-all duration-150"
              style={{ border: '1px solid #e2e8f0', background: '#fff' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#94a3b8' }}
              onBlur={e  => { e.currentTarget.style.borderColor = '#e2e8f0' }}
            />
          </div>

          {/* Ekle — koyu slate, düz ── */}
          <button
            onClick={handleAddData}
            className="w-full flex items-center justify-center gap-2 py-[8px] rounded-md text-[12px] font-semibold text-white bg-brand-chrome hover:bg-brand-chrome-hover active:bg-brand-chrome-active transition-colors duration-150 active:scale-[0.98]"
          >
            <i className="fa-solid fa-plus text-[10px]" />
            Veri Ekle
          </button>

        </div>
      )}
    </section>
  )
}
