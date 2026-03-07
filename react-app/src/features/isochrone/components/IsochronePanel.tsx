import type { OrsProfile, RouteStats } from '../types'

const TIME_OPTIONS: { minutes: number; color: string; bg: string; border: string; ring: string }[] = [
  { minutes: 5,  color: '#06b6d4', bg: 'bg-[#06b6d4]', border: 'border-[#06b6d4]', ring: 'ring-[#06b6d4]' },
  { minutes: 10, color: '#22c55e', bg: 'bg-[#22c55e]', border: 'border-[#22c55e]', ring: 'ring-[#22c55e]' },
  { minutes: 15, color: '#eab308', bg: 'bg-[#eab308]', border: 'border-[#eab308]', ring: 'ring-[#eab308]' },
  { minutes: 30, color: '#f97316', bg: 'bg-[#f97316]', border: 'border-[#f97316]', ring: 'ring-[#f97316]' },
  { minutes: 45, color: '#ef4444', bg: 'bg-[#ef4444]', border: 'border-[#ef4444]', ring: 'ring-[#ef4444]' },
  { minutes: 60, color: '#a855f7', bg: 'bg-[#a855f7]', border: 'border-[#a855f7]', ring: 'ring-[#a855f7]' },
]

const PROFILES: { value: OrsProfile; icon: string; label: string }[] = [
  { value: 'foot-walking', icon: 'fa-person-walking', label: 'Yaya' },
  { value: 'cycling-regular', icon: 'fa-bicycle', label: 'Bisiklet' },
  { value: 'driving-car', icon: 'fa-car', label: 'Araç' },
]

function formatDistance(metres: number): string {
  return metres >= 1000
    ? `${(metres / 1000).toFixed(1)} km`
    : `${Math.round(metres)} m`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} sa ${m} dk`
  return `${m} dk`
}

interface IsochronePanelProps {
  isOpen: boolean
  mode: OrsProfile
  selectedTimes: number[]
  origin: [number, number] | null
  isochroneData: GeoJSON.FeatureCollection | null
  routeStats: RouteStats | null
  isLoading: boolean
  isRouteLoading: boolean
  isAwaitingDestination: boolean
  error: string | null
  onModeChange: (mode: OrsProfile) => void
  onTimeToggle: (minutes: number) => void
  onStartDirections: () => void
  onCancelDirections: () => void
  onClose: () => void
  onDeactivate: () => void
}

export default function IsochronePanel({
  isOpen,
  mode,
  selectedTimes,
  origin,
  isochroneData,
  routeStats,
  isLoading,
  isRouteLoading,
  isAwaitingDestination,
  error,
  onModeChange,
  onTimeToggle,
  onStartDirections,
  onCancelDirections,
  onClose,
  onDeactivate,
}: IsochronePanelProps) {
  if (!isOpen) return null

  const hasOrigin = origin !== null
  const anyLoading = isLoading || isRouteLoading

  const areaStats = isochroneData?.features
    ? isochroneData.features
      .filter((f) => f.properties?.area != null)
      .sort((a, b) => (a.properties?.value ?? 0) - (b.properties?.value ?? 0))
    : []

  return (
    <div className="fixed top-14 right-14 z-1500 w-68 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

      {/* Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-50 to-sky-50 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500 flex items-center justify-center">
            <i className="fa-solid fa-circle-nodes text-white text-[10px]"></i>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-zinc-800">Erişilebilirlik Analizi</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
        >
          <i className="fa-solid fa-xmark text-[10px]"></i>
        </button>
      </div>

      <div className="px-3.5 py-3 space-y-3">

        {/* Transport mode */}
        <div>
          <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
            Ulaşım Modu
          </label>
          <div className="flex gap-1.5">
            {PROFILES.map((p) => (
              <button
                key={p.value}
                onClick={() => onModeChange(p.value)}
                disabled={anyLoading}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg border text-[9px] font-medium transition-all ${
                  mode === p.value
                    ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <i className={`fa-solid ${p.icon} text-[11px]`}></i>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time intervals */}
        <div>
          <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
            Zaman Aralıkları
          </label>
          <div className="grid grid-cols-3 gap-1">
            {TIME_OPTIONS.map(({ minutes, color, bg, border }) => {
              const active = selectedTimes.includes(minutes)
              return (
                <button
                  key={minutes}
                  onClick={() => onTimeToggle(minutes)}
                  disabled={anyLoading}
                  className={`flex items-center justify-center gap-1 px-2 py-1 rounded-md border text-[9px] font-medium transition-all disabled:cursor-not-allowed ${
                    active
                      ? `${bg} ${border} text-white shadow-sm`
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50'
                  }`}
                  style={active ? {} : { '--hover-color': color } as React.CSSProperties}
                >
                  {active
                    ? <i className="fa-solid fa-check text-[8px]"></i>
                    : <span className="w-2 h-2 rounded-full border border-zinc-300 inline-block"></span>
                  }
                  {minutes} dk
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Status block ── */}
        <StatusBlock
          hasOrigin={hasOrigin}
          origin={origin}
          isLoading={isLoading}
          isRouteLoading={isRouteLoading}
          isAwaitingDestination={isAwaitingDestination}
          error={error}
          areaStats={areaStats}
          routeStats={routeStats}
          mode={mode}
        />

        {/* ── Route action ── */}
        <RouteAction
          hasOrigin={hasOrigin}
          isAwaitingDestination={isAwaitingDestination}
          anyLoading={anyLoading}
          routeStats={routeStats}
          onStart={onStartDirections}
          onCancel={onCancelDirections}
        />

        {/* Deactivate */}
        <button
          onClick={onDeactivate}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium text-zinc-500 bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-100"
        >
          <i className="fa-solid fa-power-off text-[9px]"></i>
          Analizi Kapat
        </button>

      </div>
    </div>
  )
}

/* ─────────────────────────────── Sub-components ─────────────────────────── */

interface StatusBlockProps {
  hasOrigin: boolean
  origin: [number, number] | null
  isLoading: boolean
  isRouteLoading: boolean
  isAwaitingDestination: boolean
  error: string | null
  areaStats: GeoJSON.Feature[]
  routeStats: RouteStats | null
  mode: OrsProfile
}

function StatusBlock({
  hasOrigin, origin, isLoading, isRouteLoading,
  isAwaitingDestination, error, areaStats, routeStats, mode,
}: StatusBlockProps) {
  // 1 — Awaiting destination click
  if (isAwaitingDestination) {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 flex items-start gap-2.5">
        <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 animate-pulse">
          <i className="fa-solid fa-location-crosshairs text-white text-[9px]"></i>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-blue-700">Hedef noktası bekleniyor</p>
          <p className="text-[9px] text-blue-500 mt-0.5">Haritada varış noktasına tıklayın</p>
        </div>
      </div>
    )
  }

  // 2 — Route loading
  if (isRouteLoading) {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 flex items-center gap-2.5">
        <i className="fa-solid fa-circle-notch fa-spin text-blue-500 text-[13px]"></i>
        <div>
          <p className="text-[10px] font-semibold text-blue-700">Rota hesaplanıyor...</p>
          <p className="text-[9px] text-blue-400">{modeLabel(mode)}</p>
        </div>
      </div>
    )
  }

  // 3 — Isochrone loading
  if (isLoading) {
    return (
      <div className="rounded-lg bg-cyan-50 border border-cyan-100 px-3 py-2.5 flex items-center gap-2.5">
        <i className="fa-solid fa-circle-notch fa-spin text-cyan-500 text-[13px]"></i>
        <div>
          <p className="text-[10px] font-semibold text-cyan-700">Hesaplanıyor...</p>
          <p className="text-[9px] text-cyan-400">{modeLabel(mode)}</p>
        </div>
      </div>
    )
  }

  // 4 — Error
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 flex items-start gap-2">
        <i className="fa-solid fa-triangle-exclamation text-red-400 text-[11px] mt-0.5"></i>
        <p className="text-[9px] text-red-600 leading-relaxed">{error}</p>
      </div>
    )
  }

  // 5 — Route stats available
  if (routeStats) {
    return (
      <div className="space-y-1.5">
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
          <p className="text-[9px] font-semibold text-blue-500 uppercase tracking-wider mb-1.5">Rota</p>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-road text-blue-400 text-[10px]"></i>
              <span className="text-[11px] font-bold text-blue-700">{formatDistance(routeStats.distance)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <i className="fa-regular fa-clock text-blue-400 text-[10px]"></i>
              <span className="text-[11px] font-bold text-blue-700">{formatDuration(routeStats.duration)}</span>
            </div>
          </div>
        </div>
        {areaStats.length > 0 && <AreaStats areaStats={areaStats} />}
      </div>
    )
  }

  // 6 — Origin set, isochrones ready
  if (hasOrigin && areaStats.length > 0) {
    return (
      <div className="space-y-1.5">
        <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <i className="fa-solid fa-location-dot text-cyan-500 text-[10px]"></i>
            <span className="text-[9px] font-mono text-zinc-500">
              {origin![1].toFixed(4)}°K · {origin![0].toFixed(4)}°D
            </span>
          </div>
          <AreaStats areaStats={areaStats} />
        </div>
      </div>
    )
  }

  // 7 — Waiting for first click
  return (
    <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-3 flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
        <i className="fa-regular fa-hand-pointer text-cyan-500 text-[12px]"></i>
      </div>
      <div>
        <p className="text-[10px] font-medium text-zinc-600">Başlangıç noktası seçin</p>
        <p className="text-[9px] text-zinc-400 mt-0.5">Haritada bir konuma tıklayın</p>
      </div>
    </div>
  )
}

const TIME_COLOR_MAP: Record<number, string> = {
  300: '#06b6d4',
  600: '#22c55e',
  900: '#eab308',
  1800: '#f97316',
  2700: '#ef4444',
  3600: '#a855f7',
}

function AreaStats({ areaStats }: { areaStats: GeoJSON.Feature[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {areaStats.map((f) => {
        const val = f.properties?.value as number
        const area = f.properties?.area as number
        const mins = Math.round(val / 60)
        const km2 = (area / 1_000_000).toFixed(1)
        const color = TIME_COLOR_MAP[val] ?? '#06b6d4'
        return (
          <span
            key={val}
            className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {mins} dk · {km2} km²
          </span>
        )
      })}
    </div>
  )
}

interface RouteActionProps {
  hasOrigin: boolean
  isAwaitingDestination: boolean
  anyLoading: boolean
  routeStats: RouteStats | null
  onStart: () => void
  onCancel: () => void
}

function RouteAction({ hasOrigin, isAwaitingDestination, anyLoading, routeStats, onStart, onCancel }: RouteActionProps) {
  if (isAwaitingDestination) {
    return (
      <button
        onClick={onCancel}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-100 animate-in fade-in duration-150"
      >
        <i className="fa-solid fa-xmark text-[10px]"></i>
        Rota Seçimini İptal Et
      </button>
    )
  }

  return (
    <button
      onClick={onStart}
      disabled={!hasOrigin || anyLoading}
      className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold transition-all border ${
        hasOrigin && !anyLoading
          ? routeStats
            ? 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 shadow-sm'
            : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
          : 'bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed'
      }`}
    >
      <i className={`fa-solid ${routeStats ? 'fa-rotate' : 'fa-route'} text-[10px]`}></i>
      {routeStats ? 'Yeni Rota Hesapla' : 'Rota Hesapla'}
    </button>
  )
}

function modeLabel(mode: OrsProfile): string {
  if (mode === 'driving-car') return 'Araç ile'
  if (mode === 'cycling-regular') return 'Bisiklet ile'
  return 'Yaya olarak'
}
