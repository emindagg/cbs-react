import type { TerrainAnalysisPoint, TerrainAnalysisResult } from '../types'

interface TerrainAnalysisPanelProps {
  isOpen: boolean
  isActive: boolean
  isLoading: boolean
  error: string | null
  selectedPoint: TerrainAnalysisPoint | null
  result: TerrainAnalysisResult | null
  onClose: () => void
  onDeactivate: () => void
}

function formatCoordinate(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

function formatNumber(value: number, fractionDigits = 1): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export default function TerrainAnalysisPanel({
  isOpen,
  isActive,
  isLoading,
  error,
  selectedPoint,
  result,
  onClose,
  onDeactivate,
}: TerrainAnalysisPanelProps) {
  if (!isOpen) return null

  const aspectLabel = result?.aspectDegrees === null
    ? 'Düz'
    : result
      ? `${result.aspectDegrees}°`
      : '-'

  return (
    <div className="fixed top-14 right-14 z-1500 w-64 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500 flex items-center justify-center">
            <i className="fa-solid fa-compass text-white text-[10px]"></i>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-zinc-800">Bakı Analizi</h3>
            <p className="text-[8px] text-zinc-500">AWS Terrarium DEM</p>
          </div>
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
        {!isActive && (
          <div className="text-[10px] text-zinc-500 bg-zinc-50 rounded-md px-2.5 py-2 leading-relaxed">
            Bakı analizi aracı kapalı.
          </div>
        )}

        {isActive && !selectedPoint && !isLoading && !error && !result && (
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

        {result && (
          <div className="space-y-2">
            <div className="bg-teal-50 rounded-lg px-3 py-2 text-center">
              <div className="text-[9px] text-teal-600 font-semibold uppercase tracking-wider">Bakı Yönü</div>
              <div className="text-lg font-bold text-teal-800 leading-tight">{result.directionLabel}</div>
              <div className="text-[11px] font-mono text-teal-700">{aspectLabel}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-50 rounded-md px-2 py-1.5">
                <div className="text-[8px] text-zinc-500">Yükseklik</div>
                <div className="text-[11px] font-bold text-zinc-800">{formatNumber(result.elevation)} m</div>
              </div>
              <div className="bg-zinc-50 rounded-md px-2 py-1.5">
                <div className="text-[8px] text-zinc-500">Eğim</div>
                <div className="text-[11px] font-bold text-zinc-800">{formatNumber(result.slopeDegrees)}°</div>
              </div>
              <div className="bg-zinc-50 rounded-md px-2 py-1.5">
                <div className="text-[8px] text-zinc-500">Eğim (%)</div>
                <div className="text-[11px] font-bold text-zinc-800">%{formatNumber(result.slopePercent)}</div>
              </div>
              <div className="bg-zinc-50 rounded-md px-2 py-1.5">
                <div className="text-[8px] text-zinc-500">DEM Zoom</div>
                <div className="text-[11px] font-bold text-zinc-800">z{result.tileZoom}</div>
              </div>
            </div>

            <div className="text-[9px] text-zinc-500 bg-zinc-50 rounded-md px-2.5 py-2 leading-relaxed">
              <div>Enlem: {formatCoordinate(result.point.lat)}</div>
              <div>Boylam: {formatCoordinate(result.point.lng)}</div>
            </div>
          </div>
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
