import { useState, useRef, useEffect } from 'react'

import { useMapStore } from '@/stores/useMapStore'
import type { BasemapType } from '@/stores/useMapStore'

/**
 * BasemapSwitcher Component
 * Dropdown to select basemap/tile layer
 */
export default function BasemapSwitcher() {
  const { activeBasemap, setActiveBasemap } = useMapStore()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const basemaps: { id: BasemapType; label: string; icon: string }[] = [
    { id: 'CARTO_LIGHT', label: 'Carto Açık', icon: 'fa-sun' },
    { id: 'ESRI_SATELLITE', label: 'Uydu', icon: 'fa-earth-americas' },
    { id: 'TEMEL', label: 'HGM Temel', icon: 'fa-map' },
    { id: 'UYDU', label: 'HGM Uydu', icon: 'fa-satellite' },
    { id: 'GECE', label: 'HGM Gece', icon: 'fa-star' },
    { id: 'SIYASI', label: 'HGM Siyasi', icon: 'fa-flag' },
    { id: 'YUKSEKLIK', label: 'HGM Yükseklik', icon: 'fa-mountain' },
    { id: 'NONE', label: 'Altlık Yok (Gri)', icon: 'fa-ban' },
  ]

  const handleSelect = (id: BasemapType) => {
    setActiveBasemap(id)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 bg-[#1c1c1e] rounded-full shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-sm hover:bg-black/90 active:scale-95 transition-all outline-hidden cursor-pointer"
        title="Altlık haritayı değiştir"
      >
        <i className="fa-solid fa-layer-group"></i>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-0 left-12 ml-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-3 py-2 border-b border-gray-100 mb-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Altlık Harita</h3>
          </div>

          <div className="flex flex-col">
            {basemaps.map((bm) => (
              <button
                key={bm.id}
                onClick={() => handleSelect(bm.id)}
                className={`
                                    flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors
                                    ${activeBasemap === bm.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                                `}
              >
                <i className={`fa-solid ${bm.icon} w-5 text-center ${activeBasemap === bm.id ? 'text-emerald-600' : 'text-gray-400'}`}></i>
                <span>{bm.label}</span>
                {activeBasemap === bm.id && <i className="fa-solid fa-check ml-auto text-emerald-600 text-xs"></i>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

