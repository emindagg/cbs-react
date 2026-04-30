import { getMaxSlopeAnalysisAreaKm2 } from '../services/polygonSlopeAnalysis'
import type { TerrainPolygonOption, TerrainSlopeResult } from '../types'

interface PolygonSlopeControlsProps {
  polygonOptions: TerrainPolygonOption[]
  selectedPolygonId: string | null
  slopeResult: TerrainSlopeResult | null
  slopeOpacity: number
  isLoading: boolean
  onSelectedPolygonChange: (id: string | null) => void
  onRunSlopeAnalysis: () => void
  onSlopeOpacityChange: (opacity: number) => void
}

const PERCENT_MULTIPLIER = 100
const NUMBER_FRACTION_DIGITS = 2

function formatNumber(value: number, fractionDigits = NUMBER_FRACTION_DIGITS): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export default function PolygonSlopeControls({
  polygonOptions,
  selectedPolygonId,
  slopeResult,
  slopeOpacity,
  isLoading,
  onSelectedPolygonChange,
  onRunSlopeAnalysis,
  onSlopeOpacityChange,
}: PolygonSlopeControlsProps) {
  const maxAreaKm2 = getMaxSlopeAnalysisAreaKm2()
  const selectedPolygon = polygonOptions.find((polygon) => polygon.id === selectedPolygonId) ?? null
  const isOverArea = Boolean(selectedPolygon && selectedPolygon.areaKm2 > maxAreaKm2)
  const opacityPercent = Math.round(slopeOpacity * PERCENT_MULTIPLIER)

  return (
    <div className="space-y-3">
      <div className="text-[9px] text-zinc-600 bg-emerald-50 rounded-md px-2.5 py-2 leading-relaxed">
        <i className="fa-solid fa-layer-group mr-1 text-emerald-600"></i>
        Küçük alanlarda detaylı (~10 m), büyük alanlarda genel (~30-150 m) DEM otomatik seçilir. Maksimum analiz alanı {maxAreaKm2} km².
      </div>

      <div>
        <select
          value={selectedPolygonId ?? ''}
          onChange={(event) => onSelectedPolygonChange(event.target.value || null)}
          className="w-full h-8 px-2 rounded-lg border border-zinc-200 bg-white text-[10px] text-zinc-800 outline-hidden focus:ring-2 focus:ring-teal-500"
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
        onClick={onRunSlopeAnalysis}
        disabled={!selectedPolygonId || isLoading || isOverArea}
        className="w-full h-8 rounded-lg bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        Analizi Çalıştır
      </button>

      {slopeResult && (
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
              onChange={(e) => onSlopeOpacityChange(Number(e.target.value) / PERCENT_MULTIPLIER)}
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          <div className="text-[9px] text-emerald-700 bg-emerald-50 rounded-md px-2.5 py-1.5 leading-relaxed flex items-start gap-1.5">
            <i className="fa-solid fa-circle-info mt-0.5"></i>
            <span>Lejant sürüklenebilir panele taşındı.</span>
          </div>
        </div>
      )}
    </div>
  )
}
