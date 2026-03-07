import { useState, useRef, useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'

import { useHeatmapStore } from '@/features/heatmap'
import { useIsochroneStore } from '@/features/isochrone'
import { useSpatialAnalysisStore } from '@/features/spatial-analysis'
import { useClusteringStore } from '@/stores/useClusteringStore'
import { useToolStore, type ToolType } from '@/stores/useToolStore'

import { BufferModal } from './GISToolsControl.buffer'
import { BufferOptionsControl } from './GISToolsControl.bufferOptions'
import { useDataManagementStore } from '@/features/data-management'


/**
 * GISToolsControl Component
 * 
 * 3-state toggle: closed → full (icons+labels) → icons-only → closed
 */

interface ToolDef {
  id: string
  icon: string
  label: string
  color: string
  disabled?: boolean
  group: string
}

const TOOL_GROUPS: { key: string; label: string }[] = [
  { key: 'measure', label: 'Ölçüm & Analiz' },
  { key: 'analysis', label: 'İleri Analizler' },
  { key: 'general', label: 'Genel Araçlar' },
  { key: 'reset', label: '' },
]

const TOOLS: ToolDef[] = [
  { id: 'measure-distance', icon: 'fa-ruler-combined', label: 'Mesafe & Alan', color: 'text-blue-500', group: 'measure' },
  { id: 'buffer', icon: 'fa-circle-dot', label: 'Etki Alanı Analizi', color: 'text-purple-500', group: 'analysis' },
  { id: 'clustering', icon: 'fa-layer-group', label: 'Nokta Kümeleri', color: 'text-blue-500', group: 'analysis' },
  { id: 'convex-hull', icon: 'fa-vector-square', label: 'Dış Sınır', color: 'text-orange-400', group: 'analysis' },
  { id: 'voronoi', icon: 'fa-border-all', label: 'En Yakın Alanlar', color: 'text-teal-400', group: 'analysis' },
  { id: 'nearest-points', icon: 'fa-arrows-to-dot', label: 'En Yakın Nokta', color: 'text-violet-500', group: 'analysis' },
  { id: 'heatmap', icon: 'fa-fire', label: 'Isı Haritası', color: 'text-red-400', group: 'analysis' },
  { id: 'isochrone', icon: 'fa-circle-nodes', label: 'Erişilebilirlik Analizi', color: 'text-cyan-500', group: 'analysis' },
  { id: 'screenshot', icon: 'fa-camera', label: 'Ekran Görüntüsü', color: 'text-zinc-500', group: 'general' },
  { id: 'clean-visuals', icon: 'fa-eraser', label: 'Haritayı Temizle', color: 'text-indigo-500', group: 'general' },
  { id: 'clear-data', icon: 'fa-broom', label: 'Verileri Sıfırla', color: 'text-amber-500', group: 'reset' },
  { id: 'clear-measurements', icon: 'fa-trash-can', label: 'Ölçümleri Sil', color: 'text-rose-500', group: 'reset' },
]

export default function GISToolsControl() {
  const [showBufferModal, setShowBufferModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { current: map } = useMap()

  const { mode: clusterMode, cycle: cycleClustering } = useClusteringStore()
  const { isActive: isHeatmapActive, toggle: toggleHeatmap } = useHeatmapStore()
  const { isActive: isIsochroneActive, toggle: toggleIsochrone } = useIsochroneStore()
  const { activeAnalysis, toggle: toggleSpatial } = useSpatialAnalysisStore()

  const {
    toolsMenuMode,
    toggleToolsMenu,
    toggleMenuCompact,
    closeToolsMenu,
    setActiveTool,
    activeTool,
    resetDistance,
    showMeasurementTools,
    showAdvancedAnalysis,
  } = useToolStore()

  const clearAll = useDataManagementStore(state => state.clearAll)
  const clearBufferAnalysisItems = useDataManagementStore(state => state.clearBufferAnalysisItems)
  const hasBufferAnalysisItems = useDataManagementStore(
    state => state.items.some(item => item.properties.analysis === 'buffer'),
  )
  const resetDraw = useDataManagementStore(state => state.resetDraw)

  const isOpen = toolsMenuMode !== 'closed'

  // Close dropdown when clicking outside (only in full mode)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (toolsMenuMode === 'full') closeToolsMenu()
      }
    }
    if (toolsMenuMode === 'full') {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [toolsMenuMode, closeToolsMenu])

  // Only close menu when in full mode; icons-only stays open
  const maybeClose = () => {
    if (toolsMenuMode === 'full') closeToolsMenu()
  }

  const handleScreenshot = () => {
    if (!map) return
    try {
      const canvas = map.getCanvas()
      const dataURL = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataURL
      a.download = `harita-goruntusu-${new Date().toISOString().slice(0, 19).replace('T', '_')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      maybeClose()
    } catch (e) {
      console.error('Screenshot error:', e)
    }
  }

  const handleToolSelect = (toolId: string) => {
    if (toolId === 'buffer') {
      if (showBufferModal || hasBufferAnalysisItems) {
        setShowBufferModal(false)
        clearBufferAnalysisItems()
      } else {
        setShowBufferModal(true)
      }
      maybeClose()
    } else if (toolId === 'clustering') {
      cycleClustering()
      maybeClose()
    } else if (toolId === 'heatmap') {
      toggleHeatmap()
      maybeClose()
    } else if (toolId === 'isochrone') {
      toggleIsochrone()
      maybeClose()
    } else if (toolId === 'convex-hull') {
      toggleSpatial('convex-hull')
      maybeClose()
    } else if (toolId === 'voronoi') {
      toggleSpatial('voronoi')
      maybeClose()
    } else if (toolId === 'nearest-points') {
      toggleSpatial('nearest-points')
      maybeClose()
    } else if (toolId === 'screenshot') {
      handleScreenshot()
    } else if (toolId === 'clean-visuals') {
      resetDistance()
      resetDraw()
      maybeClose()
    } else if (toolId === 'clear-data') {
      clearAll()
      maybeClose()
    } else if (toolId === 'clear-measurements') {
      resetDistance()
      maybeClose()
    } else {
      // Toggle: if already active, deactivate; otherwise activate
      setActiveTool(activeTool === toolId ? 'none' as ToolType : toolId as ToolType)
      maybeClose()
    }
  }

  const isToolActive = (toolId: string) => {
    if (toolId === 'clustering') return clusterMode !== 'normal'
    if (toolId === 'heatmap') return isHeatmapActive
    if (toolId === 'isochrone') return isIsochroneActive
    if (toolId === 'convex-hull') return activeAnalysis === 'convex-hull'
    if (toolId === 'voronoi') return activeAnalysis === 'voronoi'
    if (toolId === 'nearest-points') return activeAnalysis === 'nearest-points'
    return activeTool === toolId
  }

  const getToolLabel = (tool: ToolDef) => {
    if (tool.id === 'clustering' && clusterMode === 'clustered') return 'Noktaları Gizle'
    if (tool.id === 'clustering' && clusterMode === 'hidden') return 'Normal Göster'
    if (tool.id === 'heatmap' && isHeatmapActive) return 'Isı Haritasını Kapat'
    if (tool.id === 'isochrone' && isIsochroneActive) return 'İzocron Kapat'
    if (tool.id === 'convex-hull' && activeAnalysis === 'convex-hull') return 'Dış Sınırı Kapat'
    if (tool.id === 'voronoi' && activeAnalysis === 'voronoi') return 'Voronoi\'yi Kapat'
    if (tool.id === 'nearest-points' && activeAnalysis === 'nearest-points') return 'Analizi Kapat'
    return tool.label
  }

  const getToolActiveStyle = (toolId: string) => {
    if (toolId === 'clustering') {
      if (clusterMode === 'clustered') return { bg: 'bg-blue-500', ring: 'ring-blue-300', shadow: 'shadow-[0_2px_8px_rgba(59,130,246,0.4)]', text: 'text-blue-700', bgIcon: 'bg-blue-500', border: 'border-l-blue-500', bgRow: 'bg-blue-50', badge: 'text-blue-500', label: 'Kümelenmiş' }
      if (clusterMode === 'hidden') return { bg: 'bg-red-500', ring: 'ring-red-300', shadow: 'shadow-[0_2px_8px_rgba(239,68,68,0.4)]', text: 'text-red-700', bgIcon: 'bg-red-500', border: 'border-l-red-500', bgRow: 'bg-red-50', badge: 'text-red-500', label: 'Gizli' }
    }
    return null
  }

  const enabledTools = TOOLS.filter((t) => {
    if (t.disabled) return false
    if (t.group === 'measure' && !showMeasurementTools) return false
    if (t.group === 'analysis' && !showAdvancedAnalysis) return false
    return true
  })

  return (
    <div ref={containerRef} className="absolute top-3 right-3 z-10002 flex flex-col items-end">
      {/* Main Toggle Button */}
      <button
        id="toggle-gis-tools"
        onClick={(e) => {
          e.stopPropagation()
          toggleToolsMenu()
        }}
        className={`w-9 h-9 flex items-center justify-center rounded-[12px] border-none cursor-pointer transition-colors ${toolsMenuMode === 'icons-only'
          ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.4)]'
          : isOpen
            ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]'
            : 'bg-[#1c1c1e] hover:bg-[#2a2a2c] hover:text-white/70 active:bg-[#2c2c2e] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
          }`}
        title="CBS Araçları"
      >
        <i className={`fa-solid fa-screwdriver-wrench text-[13px] ${isOpen ? 'rotate-45' : ''} transition-transform duration-300`}></i>
      </button>

      {/* Full Mode: Icons + Labels */}
      {toolsMenuMode === 'full' && (
        <div className="mt-2 w-52 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-end px-2 pt-1.5">
            <button
              onClick={toggleMenuCompact}
              className="w-8 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="Sadece ikonlar"
            >
              <i className="fa-solid fa-angles-left text-[11px]"></i>
            </button>
          </div>
          <div className="pb-1.5 divide-y divide-zinc-50">
            {TOOL_GROUPS.map((group) => {
              if (group.key === 'measure' && !showMeasurementTools) return null
              if (group.key === 'analysis' && !showAdvancedAnalysis) return null
              const groupTools = enabledTools.filter((t) => t.group === group.key)
              if (groupTools.length === 0) return null
              return (
                <div key={group.key} className="py-1">
                  {group.label && (
                    <div className="px-3 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      {group.label}
                    </div>
                  )}
                  {groupTools.map((tool) => (
                    <CompactMenuItem
                      key={tool.id}
                      icon={tool.icon}
                      label={getToolLabel(tool)}
                      color={tool.color}
                      onClick={() => handleToolSelect(tool.id)}
                      active={isToolActive(tool.id)}
                      disabled={tool.disabled}
                      activeStyle={getToolActiveStyle(tool.id)}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Icons-Only Mode: Compact icon strip */}
      {toolsMenuMode === 'icons-only' && (
        <div className="mt-2 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-1.5 flex flex-col gap-1.5">
          <button
            onClick={toggleMenuCompact}
            className="w-8 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title="Etiketleri göster"
          >
            <i className="fa-solid fa-angles-right text-[11px]"></i>
          </button>
          {enabledTools.map((tool) => {
            const active = isToolActive(tool.id)
            const customStyle = getToolActiveStyle(tool.id)
            return (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${active
                  ? customStyle
                    ? `${customStyle.bg} text-white ${customStyle.shadow} ring-2 ${customStyle.ring}`
                    : 'bg-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.4)] ring-2 ring-blue-300'
                  : 'hover:bg-zinc-100 text-zinc-600 hover:scale-105'
                  }`}
                title={getToolLabel(tool)}
              >
                <i className={`fa-solid ${tool.icon} text-[13px] ${active ? 'text-white' : tool.color}`}></i>
              </button>
            )
          })}
        </div>
      )}

      {/* Buffer Modal */}
      <BufferOptionsControl hasBufferResults={hasBufferAnalysisItems} />

      {/* Buffer Modal */}
      <BufferModal
        isOpen={showBufferModal}
        onClose={() => setShowBufferModal(false)}
      />
    </div>
  )
}

/**
 * Compact List MenuItem (Full mode)
 */
interface ActiveStyle {
  bg: string; ring: string; shadow: string; text: string
  bgIcon: string; border: string; bgRow: string; badge: string; label: string
}

interface CompactMenuItemProps {
  icon: string
  label: string
  onClick?: () => void
  active?: boolean
  color: string
  disabled?: boolean
  activeStyle?: ActiveStyle | null
}

function CompactMenuItem({ icon, label, onClick, active, color, disabled, activeStyle }: CompactMenuItemProps) {
  const rowColor = active
    ? activeStyle ? `${activeStyle.bgRow} ${activeStyle.text} ${activeStyle.border}` : 'bg-blue-50 text-blue-700 border-l-blue-500'
    : disabled ? 'opacity-40 cursor-not-allowed text-zinc-400 border-l-transparent'
      : 'hover:bg-zinc-50 text-zinc-700 cursor-pointer border-l-transparent hover:border-l-zinc-300'

  const iconBg = active
    ? activeStyle ? `${activeStyle.bgIcon} text-white` : 'bg-blue-500 text-white'
    : 'bg-transparent'

  const badgeColor = active && activeStyle ? activeStyle.badge : 'text-blue-500'
  const badgeDot = active && activeStyle ? activeStyle.bgIcon : 'bg-blue-500'
  const badgeLabel = active && activeStyle ? activeStyle.label : 'Aktif'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2 transition-all duration-200 text-left border-l-[3px] ${rowColor}`}
    >
      <div className={`w-[18px] h-[18px] flex items-center justify-center rounded transition-colors ${iconBg}`}>
        <i className={`fa-solid ${icon} ${active ? 'text-white' : color} text-[10px]`}></i>
      </div>
      <span className={`text-[11px] ${active ? `font-bold ${activeStyle ? activeStyle.text : 'text-blue-700'}` : 'font-medium'} truncate`}>{label}</span>
      {active && (
        <div className="ml-auto flex items-center gap-1">
          <span className={`text-[8px] font-bold ${badgeColor} uppercase tracking-wider`}>{badgeLabel}</span>
          <div className={`w-1.5 h-1.5 rounded-full ${badgeDot} animate-pulse`}></div>
        </div>
      )}
      {disabled && <span className="ml-auto text-[8px] bg-zinc-100 text-zinc-400 px-1 py-0.5 rounded-sm uppercase">Yakında</span>}
    </button>
  )
}
