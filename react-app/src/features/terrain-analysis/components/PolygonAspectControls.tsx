import { getMaxAspectAnalysisAreaKm2 } from '../services/polygonAspectAnalysis'
import type { TerrainAspectResult, TerrainPolygonOption } from '../types'

interface PolygonAspectControlsProps {
  polygonOptions: TerrainPolygonOption[]
  selectedPolygonId: string | null
  aspectResult: TerrainAspectResult | null
  aspectOpacity: number
  isLoading: boolean
  onSelectedPolygonChange: (id: string | null) => void
  onRunAspectAnalysis: () => void
  onAspectOpacityChange: (opacity: number) => void
}

const PERCENT_MULTIPLIER = 100
const NUMBER_FRACTION_DIGITS = 2

function formatNumber(value: number, fractionDigits = NUMBER_FRACTION_DIGITS): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export default function PolygonAspectControls({
  polygonOptions,
  selectedPolygonId,
  aspectResult,
  aspectOpacity,
  isLoading,
  onSelectedPolygonChange,
  onRunAspectAnalysis,
  onAspectOpacityChange,
}: PolygonAspectControlsProps) {
  const maxAreaKm2 = getMaxAspectAnalysisAreaKm2()
  const selectedPolygon = polygonOptions.find((polygon) => polygon.id === selectedPolygonId) ?? null
  const isOverArea = Boolean(selectedPolygon && selectedPolygon.areaKm2 > maxAreaKm2)
  const opacityPercent = Math.round(aspectOpacity * PERCENT_MULTIPLIER)

  return (
    <div className="space-y-3">
      <div className="text-[9px] text-zinc-600 bg-violet-50 rounded-md px-2.5 py-2 leading-relaxed">
        Alan içindeki her DEM hücresi için bakı yönü hesaplanır.
      </div>

      <div>
        <select
          value={selectedPolygonId ?? ''}
          onChange={(event) => onSelectedPolygonChange(event.target.value || null)}
          className="w-full h-8 px-2 rounded-lg border border-zinc-200 bg-white text-[10px] text-zinc-800 outline-hidden focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Alan seçin</option>
          {polygonOptions.map((polygon) => (
            <option key={polygon.id} value={polygon.id}>
              {polygon.name} ({formatNumber(polygon.areaKm2)} km²)
            </option>
          ))}
        </select>
      </div>

      {polygonOptions.length === 0 && (
        <div className="text-[10px] text-zinc-500 bg-zinc-50 rounded-md px-2.5 py-2 leading-relaxed">
          Analiz için görünür alan verisi yok. Önce bir alan çizin veya alan katmanı yükleyin.
        </div>
      )}

      {isOverArea && selectedPolygon && (
        <div className="text-[10px] text-red-700 bg-red-50 rounded-md px-2.5 py-2 leading-relaxed">
          Seçili alan {formatNumber(selectedPolygon.areaKm2)} km². En fazla {maxAreaKm2} km² analiz edilebilir.
        </div>
      )}

      <button
        onClick={onRunAspectAnalysis}
        disabled={!selectedPolygonId || isLoading || isOverArea}
        className="w-full h-8 rounded-lg bg-violet-600 text-white text-[10px] font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        Analizi Çalıştır
      </button>

      {aspectResult && (
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-semibold text-zinc-600 uppercase tracking-wider">
                <i className="fa-solid fa-droplet text-[8px] mr-1"></i>
                Katman Opaklığı
              </label>
              <span className="text-[10px] font-bold text-zinc-700 tabular-nums">%{opacityPercent}</span>
            </div>
            <input
              type="range"
              min={0}
              max={PERCENT_MULTIPLIER}
              value={opacityPercent}
              onChange={(e) => onAspectOpacityChange(Number(e.target.value) / PERCENT_MULTIPLIER)}
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
          </div>

        </div>
      )}
    </div>
  )
}
