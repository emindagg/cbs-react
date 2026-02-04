import { useState, useRef, useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'

import { useClusteringStore } from '@/features/clustering'
import { useDataStore } from '@/stores/useDataStore'
import { useToolStore, type ToolType } from '@/stores/useToolStore'

import { BufferModal } from './GISToolsControl.buffer'

/**
 * GISToolsControl Component
 * 
 * Compact Light List Design - Minimalist and efficient GIS tools menu.
 * Includes all measurement, analysis, and cleaning tools.
 */
export default function GISToolsControl() {
  const [showBufferModal, setShowBufferModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { current: map } = useMap()

  // Clustering Store
  const { isEnabled: isClusteringEnabled, toggle: toggleClustering } = useClusteringStore()

  const {
    isToolsMenuOpen,
    setIsToolsMenuOpen,
    setActiveTool,
    activeTool,
    resetDistance,
    resetDraw,
  } = useToolStore()

  const { clearAll } = useDataStore()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false)
      }
    }
    if (isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isToolsMenuOpen, setIsToolsMenuOpen])

  const handleScreenshot = () => {
    if (!map) return
    try {
      const canvas = map.getCanvas()
      const dataURL = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataURL
      a.download = `harita - goruntusu - ${new Date().toISOString().slice(0, 19).replace('T', '_')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setIsToolsMenuOpen(false)
    } catch (e) {
      console.error('Screenshot error:', e)
    }
  }

  const handleToolSelect = (tool: ToolType | string) => {
    if (tool === 'buffer') {
      setShowBufferModal(true)
      setIsToolsMenuOpen(false)
    } else if (tool === 'clustering') {
      toggleClustering()
      setIsToolsMenuOpen(false)
    } else if (tool === 'screenshot') {
      handleScreenshot()
    } else if (tool === 'clean-visuals') {
      resetDistance()
      resetDraw()
      setIsToolsMenuOpen(false)
    } else {
      setActiveTool(tool as ToolType)
      setIsToolsMenuOpen(false)
    }
  }


  return (
    <div ref={containerRef} className="absolute top-3 right-3 z-10002 flex flex-col items-end">
      {/* Main Toggle Button */}
      <button
        id="toggle-gis-tools"
        onClick={(e) => {
          e.stopPropagation()
          setIsToolsMenuOpen(!isToolsMenuOpen)
        }}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 border-none text-white cursor-pointer ${isToolsMenuOpen ? 'bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)]' : 'bg-[#1c1c1e] hover:bg-black shadow-[0_2px_8px_rgba(0,0,0,0.3)]'}`}
        title="CBS Araçları"
      >
        <i className={`fa-solid fa-screwdriver-wrench text-[13px] ${isToolsMenuOpen ? 'rotate-45' : ''} transition-transform duration-300`}></i>
      </button>

      {/* Compact Light List Dropdown */}
      {isToolsMenuOpen && (
        <div className="mt-2 w-52 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1.5 divide-y divide-zinc-50">
            {/* Ölçüm & Analiz */}
            <div className="py-1">
              <div className="px-3 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Ölçüm & Analiz</div>
              <CompactMenuItem
                icon="fa-ruler-combined"
                label="Mesafe & Alan"
                color="text-blue-500"
                onClick={() => handleToolSelect('measure-distance')}
                active={activeTool === 'measure-distance'}
              />
            </div>

            {/* İleri Analizler */}
            <div className="py-1">
              <div className="px-3 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">İleri Analizler</div>
              <CompactMenuItem
                icon="fa-circle-dot"
                label="Etki Alanı Analizi"
                color="text-purple-500"
                onClick={() => handleToolSelect('buffer')}
              />
              <CompactMenuItem
                icon="fa-layer-group"
                label={isClusteringEnabled ? 'Kümeleri Kapat' : 'Nokta Kümeleri'}
                color="text-blue-500"
                onClick={() => handleToolSelect('clustering')}
                active={isClusteringEnabled}
              />
              <CompactMenuItem icon="fa-vector-square" label="Dış Sınır" color="text-orange-400" disabled />
              <CompactMenuItem icon="fa-border-all" label="En Yakın Alanlar" color="text-teal-400" disabled />
              <CompactMenuItem icon="fa-fire" label="Isı Haritası" color="text-red-400" disabled />
            </div>

            {/* Genel Araçlar */}
            <div className="py-1">
              <div className="px-3 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Genel Araçlar</div>
              <CompactMenuItem
                icon="fa-camera"
                label="Ekran Görüntüsü"
                color="text-zinc-500"
                onClick={() => handleToolSelect('screenshot')}
              />
              <CompactMenuItem
                icon="fa-eraser"
                label="Haritayı Temizle"
                color="text-indigo-500"
                onClick={() => handleToolSelect('clean-visuals')}
              />
            </div>

            {/* Sıfırlama Araçları */}
            <div className="py-1">
              <CompactMenuItem
                icon="fa-broom"
                label="Verileri Sıfırla"
                color="text-amber-500"
                onClick={clearAll}
              />
              <CompactMenuItem
                icon="fa-trash-can"
                label="Ölçümleri Sil"
                color="text-rose-500"
                onClick={resetDistance}
              />
            </div>
          </div>
        </div>
      )}

      {/* Buffer Modal */}
      <BufferModal
        isOpen={showBufferModal}
        onClose={() => setShowBufferModal(false)}
      />
    </div>
  )
}

/**
 * Compact List MenuItem
 */
interface CompactMenuItemProps {
  icon: string
  label: string
  onClick?: () => void
  active?: boolean
  color: string
  disabled?: boolean
}

function CompactMenuItem({ icon, label, onClick, active, color, disabled }: CompactMenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-1.5 transition-colors text-left ${active ? 'bg-blue-50 text-blue-600' : disabled ? 'opacity-40 cursor-not-allowed text-zinc-400' : 'hover:bg-zinc-50 text-zinc-700 cursor-pointer'}`}
    >
      <i className={`fa-solid ${icon} ${active ? 'text-blue-600' : color} w-4 text-center text-[12px]`}></i>
      <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'} truncate`}>{label}</span>
      {active && <div className="ml-auto w-1 h-1 rounded-full bg-blue-600"></div>}
      {disabled && <span className="ml-auto text-[8px] bg-zinc-100 text-zinc-400 px-1 py-0.5 rounded-sm uppercase">Yakında</span>}
    </button>
  )
}
