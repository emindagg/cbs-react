import type { TerrainAnalysisResult } from '../types'

interface PointAspectResultProps {
  result: TerrainAnalysisResult
}

const COORD_FRACTION_DIGITS = 4
const NUMBER_FRACTION_DIGITS = 1

function formatCoordinate(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: COORD_FRACTION_DIGITS,
    maximumFractionDigits: COORD_FRACTION_DIGITS,
  })
}

function formatNumber(value: number, fractionDigits = NUMBER_FRACTION_DIGITS): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export default function PointAspectResult({ result }: PointAspectResultProps) {
  const aspectLabel = result.aspectDegrees === null ? 'Düz' : `${result.aspectDegrees}°`

  return (
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
  )
}
