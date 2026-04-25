import { getMaxSlopeAnalysisAreaKm2 } from '../services/polygonSlopeAnalysis'
import type { TerrainAnalysisMode, TerrainAnalysisPoint, TerrainAnalysisResult, TerrainPolygonOption, TerrainSlopeResult } from '../types'

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
  onModeChange: (mode: TerrainAnalysisMode) => void
  onSelectedPolygonChange: (id: string | null) => void
  onRunSlopeAnalysis: () => void
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
  mode,
  selectedPoint,
  result,
  polygonOptions,
  selectedPolygonId,
  slopeResult,
  onModeChange,
  onSelectedPolygonChange,
  onRunSlopeAnalysis,
  onClose,
  onDeactivate,
}: TerrainAnalysisPanelProps) {
  if (!isOpen) return null

  const aspectLabel = result?.aspectDegrees === null
    ? 'Düz'
    : result
      ? `${result.aspectDegrees}°`
      : '-'
  const selectedPolygon = polygonOptions.find((polygon) => polygon.id === selectedPolygonId) ?? null

  return (
    <div className="fixed top-14 right-14 z-1500 w-64 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500 flex items-center justify-center">
            <i className="fa-solid fa-compass text-white text-[10px]"></i>
          </div>
          <h3 className="text-[11px] font-bold text-zinc-800">Bakı ve Eğim Analizi</h3>
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
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            onClick={() => onModeChange('point-aspect')}
            className={`h-7 rounded-md text-[10px] font-semibold transition-colors ${mode === 'point-aspect' ? 'bg-white text-teal-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Bakı Analizi
          </button>
          <button
            onClick={() => onModeChange('polygon-slope')}
            className={`h-7 rounded-md text-[10px] font-semibold transition-colors ${mode === 'polygon-slope' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Eğim Analizi
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

        {mode === 'point-aspect' && result && (
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

        {mode === 'polygon-slope' && (
          <div className="space-y-3">
            <div className="text-[9px] text-zinc-600 bg-emerald-50 rounded-md px-2.5 py-2 leading-relaxed">
              <i className="fa-solid fa-layer-group mr-1 text-emerald-600"></i>
              Dinamik çözünürlük (LOD) etkin. Küçük alanlarda detaylı (~10 m), büyük alanlarda genel (~30-150 m) DEM otomatik seçilir. Maks {getMaxSlopeAnalysisAreaKm2()} km².
            </div>

            <div>
              <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Polygon Seç
              </label>
              <select
                value={selectedPolygonId ?? ''}
                onChange={(event) => onSelectedPolygonChange(event.target.value || null)}
                className="w-full h-8 px-2 rounded-lg border border-zinc-200 bg-white text-[10px] text-zinc-800 outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Polygon seçin</option>
                {polygonOptions.map((polygon) => (
                  <option key={polygon.id} value={polygon.id}>
                    {polygon.name} ({formatNumber(polygon.areaKm2, 2)} km²)
                  </option>
                ))}
              </select>
            </div>

            {polygonOptions.length === 0 && (
              <div className="text-[10px] text-zinc-500 bg-zinc-50 rounded-md px-2.5 py-2 leading-relaxed">
                Analiz için görünür polygon verisi yok. Önce bir alan çizin veya polygon katmanı yükleyin.
              </div>
            )}

            {selectedPolygon && selectedPolygon.areaKm2 > getMaxSlopeAnalysisAreaKm2() && (
              <div className="text-[10px] text-red-700 bg-red-50 rounded-md px-2.5 py-2 leading-relaxed">
                Seçili alan {formatNumber(selectedPolygon.areaKm2, 2)} km². En fazla {getMaxSlopeAnalysisAreaKm2()} km² analiz edilebilir.
              </div>
            )}

            <button
              onClick={onRunSlopeAnalysis}
              disabled={!selectedPolygonId || isLoading || Boolean(selectedPolygon && selectedPolygon.areaKm2 > getMaxSlopeAnalysisAreaKm2())}
              className="w-full h-8 rounded-lg bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Analizi Çalıştır
            </button>

            {slopeResult && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-zinc-50 rounded-md px-2 py-1.5">
                    <div className="text-[8px] text-zinc-500">Ortalama</div>
                    <div className="text-[10px] font-bold text-zinc-800">%{formatNumber(slopeResult.avgSlopePercent)}</div>
                  </div>
                  <div className="bg-zinc-50 rounded-md px-2 py-1.5">
                    <div className="text-[8px] text-zinc-500">Min</div>
                    <div className="text-[10px] font-bold text-zinc-800">%{formatNumber(slopeResult.minSlopePercent)}</div>
                  </div>
                  <div className="bg-zinc-50 rounded-md px-2 py-1.5">
                    <div className="text-[8px] text-zinc-500">Max</div>
                    <div className="text-[10px] font-bold text-zinc-800">%{formatNumber(slopeResult.maxSlopePercent)}</div>
                  </div>
                </div>

                <div className="text-[9px] text-zinc-600 bg-zinc-50 rounded-md px-2.5 py-1.5 flex items-center justify-between">
                  <span>
                    <i className="fa-solid fa-layer-group mr-1 text-emerald-600"></i>
                    DEM: <strong>~{formatNumber(slopeResult.resolutionMeters, 0)} m</strong> / piksel
                  </span>
                  <span className="text-zinc-400">z{slopeResult.tileZoom} · {slopeResult.estimatedTiles} tile</span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold text-zinc-700">Lejant - Eğim Yüzdesi</div>
                  {slopeResult.classes.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-[9px] text-zinc-700">
                      <span className="w-5 h-3 rounded-sm border border-zinc-300" style={{ backgroundColor: item.color }} />
                      <span className="font-medium">{item.label}</span>
                      <span className="ml-auto text-zinc-400">{item.pixelCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
