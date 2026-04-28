import type {
  TerrainAnalysisMode,
  TerrainAnalysisPoint,
  TerrainAnalysisResult,
  TerrainAspectResult,
  TerrainPolygonOption,
  TerrainSlopeResult,
} from '../types'
import PointAspectResult from './PointAspectResult'
import PolygonAspectControls from './PolygonAspectControls'
import PolygonSlopeControls from './PolygonSlopeControls'

interface TerrainAnalysisPanelProps {
  isOpen: boolean
  isActive: boolean
  isLoading: boolean
  error: string | null
  mode: TerrainAnalysisMode
  selectedPoint: TerrainAnalysisPoint | null
  result: TerrainAnalysisResult | null
  polygonOptions: TerrainPolygonOption[]
  selectedPolygonId: string | null
  slopeResult: TerrainSlopeResult | null
  slopeOpacity: number
  aspectResult: TerrainAspectResult | null
  aspectOpacity: number
  onModeChange: (mode: TerrainAnalysisMode) => void
  onSelectedPolygonChange: (id: string | null) => void
  onRunSlopeAnalysis: () => void
  onSlopeOpacityChange: (opacity: number) => void
  onRunAspectAnalysis: () => void
  onAspectOpacityChange: (opacity: number) => void
  onClose: () => void
  onDeactivate: () => void
}

export default function TerrainAnalysisPanel({
  isOpen,
  isActive,
  isLoading,
  error,
  mode,
  selectedPoint,
  result,
  polygonOptions,
  selectedPolygonId,
  slopeResult,
  slopeOpacity,
  aspectResult,
  aspectOpacity,
  onModeChange,
  onSelectedPolygonChange,
  onRunSlopeAnalysis,
  onSlopeOpacityChange,
  onRunAspectAnalysis,
  onAspectOpacityChange,
  onClose,
  onDeactivate,
}: TerrainAnalysisPanelProps) {
  if (!isOpen) return null

  return (
    <div className="fixed top-14 right-14 z-1500 w-64 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500 flex items-center justify-center">
            <i className="fa-solid fa-compass text-white text-[10px]"></i>
          </div>
          <h3 className="text-[11px] font-bold text-zinc-800">Bakı (Yamaç Yönü) ve Eğim Analizi</h3>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
          title="Paneli kapat"
        >
          <i className="fa-solid fa-xmark text-[10px]"></i>
        </button>
      </div>

      <div className="px-3.5 py-3 space-y-3">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            onClick={() => onModeChange('point-aspect')}
            className={`h-7 rounded-md text-[10px] font-semibold transition-colors ${mode === 'point-aspect' ? 'bg-white text-teal-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Nokta
          </button>
          <button
            onClick={() => onModeChange('polygon-aspect')}
            className={`h-7 rounded-md text-[10px] font-semibold transition-colors ${mode === 'polygon-aspect' ? 'bg-white text-violet-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Bakı Haritası
          </button>
          <button
            onClick={() => onModeChange('polygon-slope')}
            className={`h-7 rounded-md text-[10px] font-semibold transition-colors ${mode === 'polygon-slope' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Eğim Haritası
          </button>
        </div>

        {!isActive && (
          <div className="text-[10px] text-zinc-500 bg-zinc-50 rounded-md px-2.5 py-2 leading-relaxed">
            Bakı analizi aracı kapalı.
          </div>
        )}

        {mode === 'point-aspect' && isActive && !selectedPoint && !isLoading && !error && !result && (
          <div className="text-center py-4">
            <i className="fa-solid fa-location-crosshairs text-teal-400 text-2xl mb-2"></i>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Haritada bir nokta seçin.<br />
              Bakı, eğim ve yükseklik hesaplanacak.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-[10px] text-teal-700 bg-teal-50 rounded-md px-2.5 py-2">
            <i className="fa-solid fa-circle-notch fa-spin"></i>
            DEM verisi alınıyor...
          </div>
        )}

        {error && (
          <div className="text-[10px] text-red-700 bg-red-50 rounded-md px-2.5 py-2 leading-relaxed">
            <i className="fa-solid fa-triangle-exclamation mr-1"></i>
            {error}
          </div>
        )}

        {mode === 'point-aspect' && result && <PointAspectResult result={result} />}

        {mode === 'polygon-slope' && (
          <PolygonSlopeControls
            polygonOptions={polygonOptions}
            selectedPolygonId={selectedPolygonId}
            slopeResult={slopeResult}
            slopeOpacity={slopeOpacity}
            isLoading={isLoading}
            onSelectedPolygonChange={onSelectedPolygonChange}
            onRunSlopeAnalysis={onRunSlopeAnalysis}
            onSlopeOpacityChange={onSlopeOpacityChange}
          />
        )}

        {mode === 'polygon-aspect' && (
          <PolygonAspectControls
            polygonOptions={polygonOptions}
            selectedPolygonId={selectedPolygonId}
            aspectResult={aspectResult}
            aspectOpacity={aspectOpacity}
            isLoading={isLoading}
            onSelectedPolygonChange={onSelectedPolygonChange}
            onRunAspectAnalysis={onRunAspectAnalysis}
            onAspectOpacityChange={onAspectOpacityChange}
          />
        )}

        <button
          onClick={onDeactivate}
          className="w-full text-[10px] font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100"
        >
          <i className="fa-solid fa-power-off text-[9px]"></i>
          Analizi Kapat
        </button>
      </div>
    </div>
  )
}
