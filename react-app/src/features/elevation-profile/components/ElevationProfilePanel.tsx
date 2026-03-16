import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import type { ElevationPoint, ElevationStats } from '../types'

// ─── Mutlak Hipsometrik Renk Skalası ───────────────────────────────────────
const COLOR_STOPS: { elev: number; r: number; g: number; b: number }[] = [
  { elev: 0,    r: 30,  g: 115, b: 50  }, // koyu yeşil
  { elev: 400,  r: 120, g: 195, b: 75  }, // açık yeşil
  { elev: 800,  r: 235, g: 215, b: 55  }, // sarı
  { elev: 1200, r: 215, g: 130, b: 35  }, // turuncu
  { elev: 1800, r: 180, g: 105, b: 55  }, // açık kahverengi
  { elev: 2500, r: 110, g: 65,  b: 30  }, // koyu kahverengi
]

function interpolateColor(elev: number): string {
  const clamped = Math.max(0, elev)
  const top = COLOR_STOPS[COLOR_STOPS.length - 1]
  if (clamped >= top.elev) return `rgb(${top.r},${top.g},${top.b})`

  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const lo = COLOR_STOPS[i]
    const hi = COLOR_STOPS[i + 1]
    if (clamped >= lo.elev && clamped <= hi.elev) {
      const t = (clamped - lo.elev) / (hi.elev - lo.elev)
      const r = Math.round(lo.r + (hi.r - lo.r) * t)
      const g = Math.round(lo.g + (hi.g - lo.g) * t)
      const b = Math.round(lo.b + (hi.b - lo.b) * t)
      return `rgb(${r},${g},${b})`
    }
  }
  return `rgb(${COLOR_STOPS[0].r},${COLOR_STOPS[0].g},${COLOR_STOPS[0].b})`
}

// ─── Props ──────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean
  waypointCount: number
  elevationData: ElevationPoint[] | null
  stats: ElevationStats | null
  isLoading: boolean
  error: string | null
  onClose: () => void
  onDeactivate: () => void
  onHoverIndex: (idx: number | null) => void
  onRunAnalysis: () => void
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
interface TooltipPayload { payload?: ElevationPoint }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const color = interpolateColor(d.elevation)
  return (
    <div
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      className="bg-white/85 border border-white/60 rounded-xl px-3 py-2 shadow-xl text-[11px] min-w-[90px]"
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/60 shadow"
          style={{ background: color }} />
        <span className="font-bold text-zinc-800 tabular-nums tracking-tight"
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          {d.elevation.toLocaleString('tr-TR')} m
        </span>
      </div>
      <div className="text-zinc-400 tabular-nums text-[10px] pl-4"
        style={{ fontVariantNumeric: 'tabular-nums' }}>
        {d.distance.toFixed(1)} km
      </div>
    </div>
  )
}

// ─── Panel ──────────────────────────────────────────────────────────────────
export default function ElevationProfilePanel({
  isOpen,
  waypointCount,
  elevationData,
  stats,
  isLoading,
  error,
  onClose,
  onDeactivate,
  onHoverIndex,
  onRunAnalysis,
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1400] h-[260px] bg-white/96 backdrop-blur-md border-t border-zinc-200/80 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-100 shrink-0">
        <span className="text-[12px] font-semibold text-zinc-800 tracking-tight">Yükseklik Profili</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onRunAnalysis}
            disabled={waypointCount < 2 || isLoading}
            className="px-2.5 py-0.5 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-md transition-colors tracking-tight"
            title={waypointCount < 2 ? 'En az 2 nokta ekleyin' : 'Analizi çalıştır'}
          >
            Analizi Çalıştır
          </button>
          <button
            onClick={onDeactivate}
            className="px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
          >
            Sıfırla
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors text-[14px]"
            title="Kapat"
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex items-center gap-2 text-[12px] text-zinc-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Yükseklik verisi alınıyor…
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!elevationData && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[12px] text-zinc-400">
              {waypointCount < 2
                ? 'En az 2 nokta eklemek için haritaya tıklayın.'
                : `${waypointCount} nokta eklendi — "Analizi Çalıştır" butonuna tıklayın.`}
            </p>
          </div>
        )}

        {/* Chart */}
        {elevationData && !isLoading && (
          <ChartContent
            elevationData={elevationData}
            stats={stats}
            onHoverIndex={onHoverIndex}
          />
        )}
      </div>
    </div>
  )
}

// ─── Chart Content (useMemo için ayrı bileşen) ───────────────────────────────
function ChartContent({
  elevationData,
  stats,
  onHoverIndex,
}: {
  elevationData: ElevationPoint[]
  stats: ElevationStats | null
  onHoverIndex: (idx: number | null) => void
}) {
  const yMin = stats?.minElevation ?? 0
  const yMax = stats?.maxElevation ?? 1
  const totalDist = stats?.totalDistance ?? 0

  // Dinamik hipsometrik gradient (mutlak, 12 stop)
  const gradientStops = useMemo(() => {
    const STEPS = 12
    return Array.from({ length: STEPS + 1 }, (_, i) => {
      const offset = i / STEPS
      // offset=0 → grafik üstü=yMax, offset=1 → grafik altı=yMin
      const elev = yMax - offset * (yMax - yMin)
      return { offset: `${Math.round(offset * 100)}%`, color: interpolateColor(elev) }
    })
  }, [yMin, yMax])

  // Çizgi rengi: ortalama yüksekliğin rengi
  const strokeColor = useMemo(() => {
    const mid = (yMin + yMax) / 2
    return interpolateColor(mid)
  }, [yMin, yMax])

  // X ekseni ticks
  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.ceil(totalDist / 7))
    const ticks: number[] = []
    for (let t = 0; t <= totalDist; t += step) ticks.push(Math.round(t))
    const last = Math.round(totalDist)
    if (ticks[ticks.length - 1] !== last) ticks.push(last)
    return ticks
  }, [totalDist])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Grafik */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={elevationData}
            margin={{ top: 6, right: 14, left: 0, bottom: 2 }}
            onMouseMove={(data) => {
              const idx = data.activeTooltipIndex
              if (typeof idx === 'number') onHoverIndex(idx)
            }}
            onMouseLeave={() => onHoverIndex(null)}
          >
            <defs>
              <linearGradient id="hypsGradient" x1="0" y1="0" x2="0" y2="1">
                {gradientStops.map((s, i) => (
                  <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.85} />
                ))}
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="2 4"
              stroke="#e5e7eb"
              vertical={false}
              strokeOpacity={0.6}
            />

            <XAxis
              dataKey="distance"
              type="number"
              domain={[0, Math.round(totalDist)]}
              ticks={xTicks}
              tickFormatter={(v: number) => `${v}km`}
              tick={{ fontSize: 8, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={0}
              height={16}
            />

            <YAxis
              domain={[Math.max(0, yMin - 50), yMax + 50]}
              tickFormatter={(v: number) => `${v}`}
              tick={{ fontSize: 8, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={36}
              tickCount={4}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3' }}
            />

            <Area
              type="monotone"
              dataKey="elevation"
              stroke={strokeColor}
              strokeWidth={1.5}
              fill="url(#hypsGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: strokeColor,
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* İstatistik satırı */}
      {stats && (
        <div className="flex items-center gap-0 border-t border-zinc-100 shrink-0">
          <StatItem
            label="En Düşük"
            value={`${stats.minElevation.toLocaleString('tr-TR')} m`}
            dot={interpolateColor(stats.minElevation)}
          />
          <StatDivider />
          <StatItem
            label="Ortalama"
            value={`${stats.avgElevation.toLocaleString('tr-TR')} m`}
            dot={interpolateColor(stats.avgElevation)}
          />
          <StatDivider />
          <StatItem
            label="En Yüksek"
            value={`${stats.maxElevation.toLocaleString('tr-TR')} m`}
            dot={interpolateColor(stats.maxElevation)}
          />
          <StatDivider />
          {stats.maxSlope > 0 && (
            <>
              <StatItem label="Maks. Eğim" value={`%${stats.maxSlope}`} />
              <StatDivider />
            </>
          )}
          <StatItem label="Ort. Eğim" value={`%${stats.avgSlope}`} />
          <StatDivider />
          <StatItem label="Mesafe" value={`${stats.totalDistance.toFixed(1)} km`} />
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5">
      {dot && (
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
      )}
      <div className="flex flex-col leading-tight">
        <span className="text-[8.5px] text-zinc-400 uppercase tracking-wider whitespace-nowrap">{label}</span>
        <span
          className="text-[11px] font-semibold text-zinc-800 tabular-nums"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

function StatDivider() {
  return <div className="w-px h-6 bg-zinc-100 shrink-0" />
}
