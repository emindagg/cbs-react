import * as turf from '@turf/turf'
import { useState } from 'react'

import { useDataStore } from '@/stores/useDataStore'
import { useToolStore } from '@/stores/useToolStore'
import type { DrawMode } from '@/stores/useToolStore'

export default function SidebarDataCreation() {
  const {
    drawMode, setDrawMode,
    drawPoints, drawCenter, drawRadius,
    resetDraw,
  } = useToolStore()

  const { addItem } = useDataStore()

  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDrawMode(e.target.value as DrawMode)
    setName('')
    setDate('')
  }

  const handleAddData = () => {
    if (!name) {
      // eslint-disable-next-line no-alert
      alert('Lütfen bir isim giriniz.')
      return
    }

    let geometry: GeoJSON.Geometry | null = null

    try {
      if (drawMode === 'point' && drawPoints.length > 0) {
        geometry = { type: 'Point', coordinates: drawPoints[0] }
      }
      else if (drawMode === 'line' && drawPoints.length > 1) {
        geometry = { type: 'LineString', coordinates: drawPoints }
      }
      else if (drawMode === 'polygon' && drawPoints.length > 2) {
        geometry = { type: 'Polygon', coordinates: [[...drawPoints, drawPoints[0]]] }
      }
      else if (drawMode === 'circle' && drawCenter && drawRadius) {
        // Determine circle geometry (approximated as Polygon)
        const circle = turf.circle(drawCenter, drawRadius, { steps: 64, units: 'kilometers' })
        geometry = circle.geometry
      }

      if (geometry) {
        addItem({
          name,
          date,
          type: (drawMode === 'circle' ? 'polygon' : drawMode === 'none' ? 'point' : drawMode) as 'point' | 'line' | 'polygon' | 'circle',
          geometry,
          properties: { created_at: new Date().toISOString() },
        })

        // Reset
        resetDraw()
        setName('')
        setDate('')
        // eslint-disable-next-line no-alert
        alert('Veri başarıyla eklendi!')
      } else {
        // eslint-disable-next-line no-alert
        alert('Lütfen harita üzerinde çizim yapınız.')
      }

    } catch (_error) {
      // eslint-disable-next-line no-alert
      alert('Geometri oluşturulurken hata oluştu.')
    }
  }

  return (
    <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">Veri Oluşturma</h3>

      <div className="space-y-3">
        <div>
          <select
            value={drawMode}
            onChange={handleModeChange}
            className="w-full px-2.5 py-2 border-2 border-zinc-200 bg-white rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium hover:border-zinc-300"
          >
            <option value="none">Seçim Yapınız</option>
            <option value="point">Nokta Verisi Ekle</option>
            <option value="polygon">Alan Verisi Ekle</option>
            <option value="line">Çizgi Verisi Ekle</option>
            <option value="circle">Çember Verisi Ekle</option>
          </select>
        </div>

        {drawMode !== 'none' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-blue-50 text-blue-800 p-2 rounded-sm text-xs border border-blue-100">
              {drawMode === 'point' && 'Haritaya tıklayarak nokta ekleyin.'}
              {drawMode === 'polygon' && 'Haritaya tıklayarak alan çizin. Çift tıklayarak bitirin.'}
              {drawMode === 'line' && 'Haritaya tıklayarak çizgi çizin. Çift tıklayarak bitirin.'}
              {drawMode === 'circle' && 'Önce merkeze tıklayın, sonra yarıçapı belirleyip tekrar tıklayın.'}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Veri Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Tarihi Müze, Hastane, Park..."
                className="w-full px-2.5 py-1.5 border border-zinc-300 bg-zinc-50 rounded-lg text-xs text-zinc-900 placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">📅 Tarih (Opsiyonel)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
