import {
  Ruler,
  Disc,
  SquareDashed,
  LayoutGrid,
  Crosshair,
  Flame,
  Network,
  Camera,
  FileText,
  Eraser,
  Paintbrush,
  Trash2,
  TrendingUp,
  Waves,
} from 'lucide-react'
import { useState, useRef, useEffect, type ComponentType } from 'react'
import toast from 'react-hot-toast'
import { useMap } from 'react-map-gl/maplibre'

import { useElevationProfileStore } from '@/features/elevation-profile'
import { useInterpolationStore } from '@/features/interpolation'
import { useClusteringStore } from '@/stores/useClusteringStore'
import { useDataManagementStore } from '@/stores/useDataManagementStore'
import { useHeatmapStore } from '@/stores/useHeatmapStore'
import { useIsochroneStore } from '@/stores/useIsochroneStore'
import { useSpatialAnalysisStore } from '@/stores/useSpatialAnalysisStore'
import { useToolStore, type ToolType } from '@/stores/useToolStore'

import { BufferModal } from './GISToolsControl.buffer'
import { BufferOptionsControl } from './GISToolsControl.bufferOptions'
import { RegionSelector, type SelectionRect } from './RegionSelector'
import { exportAsPng, exportAsPdf } from '../services/mapExport'

type ExportFormat = 'png' | 'pdf'

type IconComponent = ComponentType<{
  size?: number | string
  className?: string
  strokeWidth?: number | string
  color?: string
}>

// Noun Project tarzı ağ/küme ikonu — orijinal tasarım, telif hakkı içermez
function ClusterNetworkIcon({ size = 24, className = '' }: { size?: number | string; className?: string; strokeWidth?: number | string; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <circle cx="10" cy="11" r="4" />
      <circle cx="20" cy="4" r="2.5" />
      <circle cx="3" cy="20" r="2.5" />
      <circle cx="21" cy="15" r="1.8" />
      <circle cx="4" cy="5" r="1.8" />
      <circle cx="16" cy="22" r="1.5" />
      <line x1="13.3" y1="8.7" x2="18.0" y2="5.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7.5" y1="14.2" x2="4.5" y2="18.0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13.8" y1="12.4" x2="19.3" y2="14.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7.2" y1="8.2" x2="5.3" y2="6.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11.9" y1="14.5" x2="15.3" y2="20.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

interface ToolDef {
  id: string
  icon: IconComponent
  label: string
  activeColor: string
  activeBg: string
  activeBorder: string
  disabled?: boolean
  group: string
  noHoverPreview?: boolean // hover'da aktif renk gösterilmez (döngüsel araçlar için)
}

const TOOL_GROUPS: { key: string; label: string; divider?: boolean }[] = [
  { key: 'measure', label: 'Ölçüm & Analiz' },
  { key: 'analysis', label: 'İleri Analizler' },
  { key: 'general', label: 'Genel Araçlar' },
  { key: 'reset', label: '', divider: true },
]

const TOOLS: ToolDef[] = [
  { id: 'measure-distance', icon: Ruler, label: 'Mesafe & Alan', activeColor: 'text-indigo-600', activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-200', group: 'measure' },
  { id: 'buffer', icon: Disc, label: 'Etki Alanı Analizi', activeColor: 'text-purple-600', activeBg: 'bg-purple-50', activeBorder: 'border-purple-200', group: 'analysis' },
  { id: 'clustering', icon: ClusterNetworkIcon, label: 'Nokta Kümeleri', activeColor: 'text-blue-600', activeBg: 'bg-blue-50', activeBorder: 'border-blue-200', group: 'analysis', noHoverPreview: true },
  { id: 'convex-hull', icon: SquareDashed, label: 'Dış Sınır', activeColor: 'text-amber-600', activeBg: 'bg-amber-50', activeBorder: 'border-amber-200', group: 'analysis' },
  { id: 'voronoi', icon: LayoutGrid, label: 'En Yakın Alanlar', activeColor: 'text-emerald-600', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-200', group: 'analysis' },
  { id: 'nearest-points', icon: Crosshair, label: 'En Yakın Nokta', activeColor: 'text-violet-600', activeBg: 'bg-violet-50', activeBorder: 'border-violet-200', group: 'analysis' },
  { id: 'interpolation', icon: Waves, label: 'Enterpolasyon', activeColor: 'text-indigo-600', activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-200', group: 'analysis' },
  { id: 'heatmap', icon: Flame, label: 'Isı Haritası', activeColor: 'text-red-600', activeBg: 'bg-red-50', activeBorder: 'border-red-200', group: 'analysis' },
  { id: 'isochrone', icon: Network, label: 'Erişilebilirlik Analizi', activeColor: 'text-cyan-600', activeBg: 'bg-cyan-50', activeBorder: 'border-cyan-200', group: 'analysis' },
  { id: 'elevation-profile', icon: TrendingUp, label: 'Yükselti Profili Analizi', activeColor: 'text-teal-600', activeBg: 'bg-teal-50', activeBorder: 'border-teal-200', group: 'analysis' },
  { id: 'export-png', icon: Camera, label: 'Görüntü İndir (PNG)', activeColor: 'text-zinc-700', activeBg: 'bg-zinc-100', activeBorder: 'border-zinc-300', group: 'general' },
  { id: 'export-pdf', icon: FileText, label: 'PDF Olarak İndir', activeColor: 'text-zinc-700', activeBg: 'bg-zinc-100', activeBorder: 'border-zinc-300', group: 'general' },
  { id: 'clean-visuals', icon: Eraser, label: 'Haritayı Temizle', activeColor: 'text-zinc-700', activeBg: 'bg-zinc-100', activeBorder: 'border-zinc-300', group: 'general' },
  { id: 'clear-data', icon: Paintbrush, label: 'Verileri Sıfırla', activeColor: 'text-amber-600', activeBg: 'bg-amber-50', activeBorder: 'border-amber-200', group: 'reset' },
  { id: 'clear-measurements', icon: Trash2, label: 'Ölçümleri Sil', activeColor: 'text-red-600', activeBg: 'bg-red-50', activeBorder: 'border-red-200', group: 'reset' },
]

export default function GISToolsControl() {
  const [showBufferModal, setShowBufferModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { current: map } = useMap()

  const { mode: clusterMode, cycle: cycleClustering } = useClusteringStore()
  const { isActive: isHeatmapActive, toggle: toggleHeatmap } = useHeatmapStore()
  const { isActive: isIsochroneActive, toggle: toggleIsochrone } = useIsochroneStore()
  const { activeAnalysis, toggle: toggleSpatial, deactivate: deactivateSpatial } = useSpatialAnalysisStore()
  const { isActive: isInterpolationActive, toggle: toggleInterpolation, deactivate: deactivateInterpolation } = useInterpolationStore()
  const { isPanelOpen: isElevationPanelOpen, setPanelOpen: setElevationPanelOpen, deactivate: deactivateElevation } = useElevationProfileStore()

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (toolsMenuMode === 'full') closeToolsMenu()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, toolsMenuMode, closeToolsMenu])

  // Tıklanan araç dışındaki tüm aktif araçları kapat
  const deactivateOthers = (exceptToolId: string) => {
    if (exceptToolId !== 'buffer' && (showBufferModal || hasBufferAnalysisItems)) {
      setShowBufferModal(false)
      clearBufferAnalysisItems()
    }
    if (exceptToolId !== 'heatmap' && isHeatmapActive) toggleHeatmap()
    if (exceptToolId !== 'isochrone' && isIsochroneActive) toggleIsochrone()
    if (activeAnalysis && !['convex-hull', 'voronoi', 'nearest-points'].includes(exceptToolId)) {
      deactivateSpatial()
    }
    if (exceptToolId !== 'interpolation' && isInterpolationActive) deactivateInterpolation()
    if (exceptToolId !== 'measure-distance' && activeTool === 'measure-distance') {
      setActiveTool('none' as ToolType)
    }
    if (exceptToolId !== 'elevation-profile' && isElevationPanelOpen) {
      deactivateElevation()
      setActiveTool('none' as ToolType)
    }
  }

  // PNG/PDF butonu → menüyü kapat ve bölge seçiciyi aç.
  const startExportFlow = (format: ExportFormat) => {
    closeToolsMenu()
    setExportFormat(format)
  }

  // Bölge seçici kullanıcı onayladıktan sonra gerçek export'u çalıştırır.
  const runExport = async (format: ExportFormat, region: SelectionRect | null) => {
    setExportFormat(null)
    // DOM güncellensin (selector kalksın) → bir frame bekle.
    await new Promise((r) => requestAnimationFrame(() => r(null)))

    const toastId = toast.loading(
      format === 'png' ? 'Görüntü hazırlanıyor…' : 'PDF hazırlanıyor…',
    )
    try {
      const common = { map: map?.getMap() ?? null, region }
      if (format === 'png') {
        await exportAsPng({ ...common, quality: 'high' })
      } else {
        await exportAsPdf({ ...common, quality: 'print' })
      }
      toast.success(
        format === 'png' ? 'Görüntü indirildi' : 'PDF indirildi',
        { id: toastId },
      )
    } catch (e) {
      console.error('Export error:', e)
      toast.error('Dışa aktarım sırasında hata oluştu', { id: toastId })
    }
  }

  const handleToolSelect = (toolId: string) => {
    deactivateOthers(toolId)
    if (toolId === 'buffer') {
      if (showBufferModal || hasBufferAnalysisItems) {
        setShowBufferModal(false)
        clearBufferAnalysisItems()
      } else {
        setShowBufferModal(true)
      }
    } else if (toolId === 'clustering') {
      cycleClustering()
    } else if (toolId === 'heatmap') {
      toggleHeatmap()
    } else if (toolId === 'isochrone') {
      toggleIsochrone()
    } else if (toolId === 'convex-hull') {
      toggleSpatial('convex-hull')
    } else if (toolId === 'voronoi') {
      toggleSpatial('voronoi')
    } else if (toolId === 'nearest-points') {
      toggleSpatial('nearest-points')
    } else if (toolId === 'interpolation') {
      toggleInterpolation()
    } else if (toolId === 'elevation-profile') {
      if (activeTool === 'elevation-profile') {
        deactivateElevation()
        setActiveTool('none' as ToolType)
      } else {
        setActiveTool('elevation-profile' as ToolType)
        setElevationPanelOpen(true)
      }
    } else if (toolId === 'export-png') {
      startExportFlow('png')
    } else if (toolId === 'export-pdf') {
      startExportFlow('pdf')
    } else if (toolId === 'clean-visuals') {
      resetDistance()
      resetDraw()
    } else if (toolId === 'clear-data') {
      clearAll()
    } else if (toolId === 'clear-measurements') {
      resetDistance()
    } else {
      setActiveTool(activeTool === toolId ? 'none' as ToolType : toolId as ToolType)
    }
  }

  const isToolActive = (toolId: string) => {
    if (toolId === 'clustering') return clusterMode !== 'normal'
    if (toolId === 'heatmap') return isHeatmapActive
    if (toolId === 'isochrone') return isIsochroneActive
    if (toolId === 'convex-hull') return activeAnalysis === 'convex-hull'
    if (toolId === 'voronoi') return activeAnalysis === 'voronoi'
    if (toolId === 'nearest-points') return activeAnalysis === 'nearest-points'
    if (toolId === 'interpolation') return isInterpolationActive
    if (toolId === 'elevation-profile') return activeTool === 'elevation-profile'
    return activeTool === toolId
  }

  const getToolLabel = (tool: ToolDef) => {
    if (tool.id === 'clustering' && clusterMode === 'clustered') return 'Noktaları Gizle'
    if (tool.id === 'clustering' && clusterMode === 'hidden') return 'Normal Göster'
    if (tool.id === 'heatmap' && isHeatmapActive) return 'Isı Haritasını Kapat'
    if (tool.id === 'isochrone' && isIsochroneActive) return 'Analizi Kapat'
    if (tool.id === 'convex-hull' && activeAnalysis === 'convex-hull') return 'Dış Sınırı Kapat'
    if (tool.id === 'voronoi' && activeAnalysis === 'voronoi') return 'En Yakın Alanları Kapat'
    if (tool.id === 'nearest-points' && activeAnalysis === 'nearest-points') return 'Analizi Kapat'
    if (tool.id === 'interpolation' && isInterpolationActive) return 'Enterpolasyonu Kapat'
    if (tool.id === 'elevation-profile' && activeTool === 'elevation-profile') return 'Analizi Kapat'
    return tool.label
  }

  const getEffectiveTool = (tool: ToolDef): ToolDef => {
    if (tool.id !== 'clustering') return tool
    if (clusterMode === 'hidden') return {
      ...tool,
      activeColor: 'text-amber-600',
      activeBg: 'bg-amber-50',
      activeBorder: 'border-amber-200',
    }
    return tool // 'clustered' → mavi (varsayılan)
  }

  const enabledTools = TOOLS.filter((t) => {
    if (t.disabled) return false
    if (t.group === 'measure' && !showMeasurementTools) return false
    if (t.group === 'analysis' && !showAdvancedAnalysis) return false
    return true
  })

  return (
    <div ref={containerRef} data-export-ignore="true" className={`absolute top-3 right-3 z-10002 flex flex-col items-end ${toolsMenuMode === 'closed' && !showBufferModal && !hasBufferAnalysisItems ? 'pointer-events-none' : ''}`}>
      {/* Toggle Button */}
      <button
        id="toggle-gis-tools"
        onClick={(e) => {
          e.stopPropagation()
          toggleToolsMenu()
        }}
        className={`w-9 h-9 flex items-center justify-center rounded-[12px] border-none cursor-pointer transition-colors pointer-events-auto ${toolsMenuMode === 'icons-only'
          ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.4)]'
          : isOpen
            ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]'
            : 'bg-[#1c1c1e] hover:bg-[#2a2a2c] hover:text-white/70 active:bg-[#2c2c2e] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
        }`}
        title="CBS Araçları"
      >
        <i className={`fa-solid fa-screwdriver-wrench text-[13px] ${isOpen ? 'rotate-45' : ''} transition-transform duration-300`}></i>
      </button>

      {/* Icons-Only Mode */}
      {toolsMenuMode === 'icons-only' && (
        <div className="mt-2 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-1.5 flex flex-col gap-1.5">
          <button
            onClick={toggleMenuCompact}
            className="w-8 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title="Etiketleri göster"
          >
            <i className="fa-solid fa-angles-right text-[11px]"></i>
          </button>
          {enabledTools.map((tool) => (
            <ToolIconButton
              key={tool.id}
              tool={getEffectiveTool(tool)}
              label={getToolLabel(tool)}
              active={isToolActive(tool.id)}
              onClick={() => handleToolSelect(tool.id)}
            />
          ))}
        </div>
      )}

      {/* Full Mode Panel */}
      <div
        className={`mt-2 w-[185px] bg-white/90 backdrop-blur-xl border border-zinc-200/80 rounded-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] flex flex-col max-h-[calc(100vh-120px)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${toolsMenuMode === 'full'
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-4 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center px-3 py-1.5 border-b border-zinc-100">
          <span className="flex-1 text-center text-[11px] font-medium text-zinc-800">Araçlar</span>
          <button
            onClick={toggleMenuCompact}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title="Sadece ikonlar"
          >
            <i className="fa-solid fa-angles-right text-[10px]"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-1 pb-1.5 gis-tools-scrollbar">
          {TOOL_GROUPS.map((group, groupIdx) => {
            if (group.key === 'measure' && !showMeasurementTools) return null
            if (group.key === 'analysis' && !showAdvancedAnalysis) return null
            const groupTools = enabledTools.filter(t => t.group === group.key)
            if (groupTools.length === 0) return null

            return (
              <div key={group.key} className={groupIdx !== 0 ? 'mt-2' : 'mt-0.5'}>
                {group.divider && (
                  <div className="h-px w-full bg-zinc-100 my-1" />
                )}
                {group.label && (
                  <h3 className="text-[9px] font-medium text-zinc-500 px-2 mb-1">
                    {group.label}
                  </h3>
                )}
                <ul className="space-y-0.5">
                  {groupTools.map((tool) => (
                    <li key={tool.id}>
                      <ToolMenuItem
                        tool={getEffectiveTool(tool)}
                        label={getToolLabel(tool)}
                        active={isToolActive(tool.id)}
                        onClick={() => handleToolSelect(tool.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <BufferOptionsControl hasBufferResults={hasBufferAnalysisItems} />
      <BufferModal isOpen={showBufferModal} onClose={() => setShowBufferModal(false)} />

      <RegionSelector
        open={exportFormat !== null}
        title={exportFormat === 'pdf' ? 'PDF için alan seçin' : 'PNG için alan seçin'}
        confirmLabel={exportFormat === 'pdf' ? 'PDF İndir' : 'PNG İndir'}
        onConfirm={(rect) => {
          if (exportFormat) void runExport(exportFormat, rect)
        }}
        onCancel={() => setExportFormat(null)}
      />

      <style>{`
        .gis-tools-scrollbar::-webkit-scrollbar { width: 6px; }
        .gis-tools-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .gis-tools-scrollbar::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 20px; }
        .gis-tools-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #d4d4d8; }
      `}</style>
    </div>
  )
}

interface ToolIconButtonProps {
  tool: ToolDef
  label: string
  active: boolean
  onClick: () => void
}

function ToolIconButton({ tool, label, active, onClick }: ToolIconButtonProps) {
  const [hovered, setHovered] = useState(false)
  const Icon = tool.icon
  const showActive = active || (hovered && !tool.noHoverPreview)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${showActive
        ? `${tool.activeBg} ${tool.activeBorder} ring-1 ${active ? 'shadow-sm' : ''}`
        : hovered && tool.noHoverPreview
          ? 'ring-1 ring-zinc-800'
          : 'hover:scale-105'
      }`}
      title={label}
    >
      <Icon
        size={14}
        strokeWidth={2}
        className={`transition-colors duration-200 ${showActive ? tool.activeColor : 'text-zinc-500'}`}
      />
    </button>
  )
}

interface ToolMenuItemProps {
  tool: ToolDef
  label: string
  active: boolean
  onClick: () => void
}

function ToolMenuItem({ tool, label, active, onClick }: ToolMenuItemProps) {
  const [hovered, setHovered] = useState(false)
  const Icon = tool.icon
  const showActive = active || (hovered && !tool.noHoverPreview)

  return (
    <button
      onClick={onClick}
      disabled={tool.disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full flex items-center gap-2 px-2 py-[5px] rounded-md transition-all duration-150 ${showActive
        ? `${tool.activeBg} text-zinc-900`
        : hovered
          ? 'bg-zinc-100 text-zinc-700'
          : 'text-zinc-600'
      } ${tool.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Icon box */}
      <div className={`flex shrink-0 items-center justify-center w-5 h-5 rounded-[4px] border transition-all duration-200 ${showActive ? `${tool.activeBg} ${tool.activeBorder}` : 'bg-zinc-50 border-zinc-200/60'
      }`}>
        <Icon
          className={`transition-colors duration-200 ${showActive ? tool.activeColor : 'text-zinc-500'}`}
          size={11}
          strokeWidth={2}
        />
      </div>
      <span className="font-medium text-[11px] tracking-tight truncate text-left">
        {label}
      </span>
      {active && (
        <div className="ml-auto shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${tool.activeBorder.replace('border-', 'bg-').replace('-200', '-500')} animate-pulse`} />
        </div>
      )}
      {tool.disabled && (
        <span className="ml-auto text-[8px] bg-zinc-100 text-zinc-400 px-1 py-0.5 rounded-sm uppercase">Yakında</span>
      )}
    </button>
  )
}
