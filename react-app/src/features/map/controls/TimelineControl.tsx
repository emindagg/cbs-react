import { useCallback, useEffect, useRef, useMemo, useState } from 'react'

import { useDataManagementStore } from '@/features/data-management'
import {
  useTimelineStore,
  type FilterMode,
  type TimeStep,
} from '@/features/timeline'
import { useToolStore } from '@/stores/useToolStore'

const STEP_LABEL: Record<TimeStep, string> = { hour: 'Saat', day: 'Gün', week: 'Hafta', month: 'Ay', year: 'Yıl' }

const SPEED_OPTIONS = [
  { label: '0.25x', ms: 2000 },
  { label: '0.5x', ms: 1000 },
  { label: '1x', ms: 500 },
  { label: '2x', ms: 250 },
  { label: '3x', ms: 150 },
  { label: '5x', ms: 100 },
]

function speedLabel(ms: number): string {
  const match = SPEED_OPTIONS.find(s => s.ms === ms)
  return match ? match.label : '1x'
}

function fmtDate(ts: number, step: TimeStep): string {
  const d = new Date(ts)
  if (step === 'hour')
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) +
      ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  if (step === 'month') return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  if (step === 'year') return String(d.getFullYear())
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function tsOf(date: string | undefined): number | null {
  if (!date) return null
  const t = new Date(date).getTime()
  return Number.isNaN(t) ? null : t
}

const UNITS: Record<string, string> = {
  magnitude: '', buyukluk: '', depth: 'km', derinlik: 'km',
  temperature: '°C', sicaklik: '°C', elevation: 'm', yukseklik: 'm',
  distance: 'km', mesafe: 'km', rainfall: 'mm', yagis: 'mm',
}
function getUnit(f: string) { const l = f.toLowerCase(); for (const [k, u] of Object.entries(UNITS)) if (l.includes(k)) return u; return '' }

function getNumericFields(items: { properties: Record<string, unknown> }[]): string[] {
  const c = new Map<string, number>()
  for (const it of items.slice(0, 50))
    for (const [k, v] of Object.entries(it.properties)) {
      if (k === 'style' || k === 'analysis' || k === 'createdAt') continue
      if (typeof v === 'number' || (typeof v === 'string' && !Number.isNaN(Number(v)) && v.trim() !== ''))
        c.set(k, (c.get(k) ?? 0) + 1)
    }
  const min = Math.max(1, Math.floor(Math.min(items.length, 50) * 0.5))
  return [...c.entries()].filter(([, n]) => n >= min).map(([k]) => k)
}

// ── Slider ──────────────────────────────
function DualSlider({ min, max, start, end, onChange, dual }: {
  min: number; max: number; start: number; end: number
  onChange: (s: number, e: number) => void; dual: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const active = useRef<'s' | 'e' | null>(null)

  const pct = (v: number) => max > min ? ((v - min) / (max - min)) * 100 : 0

  const toVal = useCallback((cx: number) => {
    if (!trackRef.current) return min
    const rect = trackRef.current.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (cx - rect.left) / rect.width))
    return min + p * (max - min)
  }, [min, max])

  const onDown = (which: 's' | 'e') => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    active.current = which
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onMove = (e: React.PointerEvent) => {
    if (!active.current) return
    const val = toVal(e.clientX)
    if (active.current === 's') onChange(Math.min(val, end), end)
    else onChange(start, Math.max(val, dual ? start : min))
  }

  const onUp = () => { active.current = null }

  const sp = pct(start)
  const ep = pct(end)
  const left = dual ? sp : 0

  return (
    <div ref={trackRef} className="relative h-7 flex items-center select-none touch-none" onPointerMove={onMove} onPointerUp={onUp}>
      <div className="absolute inset-x-0 h-[5px] rounded-full bg-[#f0f0f0]" />
      <div className="absolute h-[5px] rounded-full bg-[#171717]" style={{ left: `${left}%`, width: `${ep - left}%` }} />
      {dual && (
        <div
          className="absolute z-20 -ml-[8px] w-4 h-4 rounded-full bg-white border-2 border-[#171717] shadow-[0_1px_3px_rgba(0,0,0,0.12)] cursor-grab active:cursor-grabbing"
          style={{ left: `${sp}%` }}
          onPointerDown={onDown('s')}
        />
      )}
      <div
        className="absolute z-20 -ml-[8px] w-4 h-4 rounded-full bg-[#171717] border-2 border-[#171717] shadow-[0_1px_3px_rgba(0,0,0,0.12)] cursor-grab active:cursor-grabbing"
        style={{ left: `${ep}%` }}
        onPointerDown={onDown('e')}
      />
    </div>
  )
}

// ── Drag hook ──────────────────────────────
function usePanelDrag() {
  const offset = useRef({ x: 0, y: 0 })
  const [delta, setDelta] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)

  const onDragStart = useCallback((e: React.PointerEvent) => {
    const el = e.target as HTMLElement
    if (el.closest('button, input, select, [data-nd]')) return
    e.preventDefault()
    dragging.current = true
    offset.current = { x: e.clientX - delta.x, y: e.clientY - delta.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [delta])

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    setDelta({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    })
  }, [])

  const onDragEnd = useCallback(() => { dragging.current = false }, [])

  const dragStyle: React.CSSProperties = (delta.x !== 0 || delta.y !== 0)
    ? { transform: `translate(calc(-50% + ${delta.x}px), ${delta.y}px)` }
    : {}

  return { dragStyle, onDragStart, onDragMove, onDragEnd }
}

// ── Main ──────────────────────────────
export default function TimelineControl() {
  const activeTool = useToolStore(s => s.activeTool)
  const setActiveTool = useToolStore(s => s.setActiveTool)
  const items = useDataManagementStore(s => s.items)
  const [showOptions, setShowOptions] = useState(false)

  const {
    isActive, isCollapsed, filterMode, timeStep,
    rangeMin, rangeMax, currentEnd, getEffectiveStart,
    isPlaying, playSpeed, numericFilter, availableNumericFields,
    activate, deactivate, setCurrentEnd, setPlaying,
    setPlaySpeed, setFilterMode, setTimeStep, setCollapsed,
    setNumericFilter, setAvailableNumericFields, updateNumericRange,
    stepForward, stepBackward, jumpToStart, jumpToEnd, tick,
  } = useTimelineStore()

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { dragStyle, onDragStart, onDragMove, onDragEnd } = usePanelDrag()

  const dated = useMemo(() => {
    const r: { ts: number }[] = []
    for (const it of items) { const t = tsOf(it.date); if (t !== null) r.push({ ts: t }) }
    return r.sort((a, b) => a.ts - b.ts)
  }, [items])

  const ready = dated.length >= 2

  useEffect(() => {
    if (activeTool === 'timeline' && ready && !isActive) {
      activate(dated[0].ts, dated[dated.length - 1].ts)
      setAvailableNumericFields(getNumericFields(items))
    } else if (activeTool !== 'timeline' && isActive) deactivate()
  }, [activeTool, ready, isActive, dated, activate, deactivate, items, setAvailableNumericFields])

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (!tick() && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      }, playSpeed)
    } else if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPlaying, playSpeed, tick])

  const togglePlay = useCallback(() => {
    if (currentEnd >= rangeMax && !isPlaying) { setCurrentEnd(rangeMin); setPlaying(true) }
    else setPlaying(!isPlaying)
  }, [currentEnd, rangeMax, rangeMin, isPlaying, setCurrentEnd, setPlaying])

  const handleClose = useCallback(() => { setActiveTool('none'); deactivate() }, [setActiveTool, deactivate])

  const handleNumField = useCallback((field: string) => {
    if (!field) { setNumericFilter(null); return }
    let mn = Infinity, mx = -Infinity
    for (const it of items) { const v = Number(it.properties[field]); if (!Number.isNaN(v)) { mn = Math.min(mn, v); mx = Math.max(mx, v) } }
    if (!Number.isFinite(mn)) return
    setNumericFilter({ field, min: mn, max: mx, currentMin: mn, currentMax: mx, unit: getUnit(field) })
  }, [items, setNumericFilter])

  const progress = rangeMax > rangeMin ? ((currentEnd - rangeMin) / (rangeMax - rangeMin)) * 100 : 0
  const effectiveStart = isActive ? getEffectiveStart() : rangeMin
  const visible = dated.filter(d => d.ts >= effectiveStart && d.ts <= currentEnd).length

  if (activeTool !== 'timeline') return null

  // Empty state
  if (!ready) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10001]" style={dragStyle}>
        <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] px-5 py-3.5 flex items-center gap-3 cursor-move" onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd}>
          <div className="w-8 h-8 rounded-lg bg-[#fafafa] border border-[#eaeaea] flex items-center justify-center">
            <i className="fa-solid fa-clock text-[#666] text-xs"></i>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#171717]">Tarihli veri bulunamadı</p>
            <p className="text-[11px] text-[#888] mt-0.5">En az 2 tarihli nokta verisi ekleyin.</p>
          </div>
          <button onClick={handleClose} className="ml-3 w-7 h-7 rounded-lg flex items-center justify-center text-[#999] hover:text-[#171717] hover:bg-[#fafafa] transition-colors">
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
      </div>
    )
  }

  // Collapsed
  if (isCollapsed) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10001]" style={dragStyle}>
        <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] px-3.5 py-2 flex items-center gap-3 cursor-move" onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd}>
          <button
            onClick={togglePlay}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 ${isPlaying ? 'bg-[#f5a623]' : 'bg-[#171717]'}`}
          >
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-[10px] ${!isPlaying ? 'ml-px' : ''}`}></i>
          </button>
          <div className="w-20 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div className="h-full bg-[#171717] rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[11px] font-medium text-[#171717] tabular-nums">{fmtDate(currentEnd, timeStep)}</span>
          <span className="text-[10px] text-[#999] tabular-nums">{visible}/{dated.length}</span>
          <button onClick={() => setCollapsed(false)} className="w-6 h-6 rounded-md flex items-center justify-center text-[#999] hover:text-[#171717] hover:bg-[#fafafa] transition-colors" title="Genişlet">
            <i className="fa-solid fa-chevron-up text-[9px]"></i>
          </button>
          <button onClick={handleClose} className="w-6 h-6 rounded-md flex items-center justify-center text-[#999] hover:text-[#e00] hover:bg-red-50 transition-colors" title="Kapat">
            <i className="fa-solid fa-xmark text-[9px]"></i>
          </button>
        </div>
      </div>
    )
  }

  // Expanded
  return (
    <div className="absolute bottom-6 left-1/2 z-[10001] w-[min(580px,calc(100vw-2rem))]" style={dragStyle}>
      <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden cursor-move" onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[12px] font-semibold text-[#171717]">Zaman Çizelgesi</span>
            <span className="text-[10px] text-[#999] border border-[#eaeaea] rounded-md px-1.5 py-0.5 font-medium">
              {filterMode === 'cumulative' ? 'Kümülatif' : 'Aralık'} · {speedLabel(playSpeed)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#666] tabular-nums font-medium">{visible}<span className="text-[#ccc] mx-0.5">/</span>{dated.length}</span>
            <div className="w-px h-4 bg-[#eaeaea] mx-0.5" />
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${showOptions ? 'bg-[#171717] text-white' : 'text-[#999] hover:text-[#171717] hover:bg-[#fafafa]'}`}
              title="Ayarlar"
            >
              <i className="fa-solid fa-sliders text-[10px]"></i>
            </button>
            <button onClick={() => setCollapsed(true)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#999] hover:text-[#171717] hover:bg-[#fafafa] transition-colors" title="Daralt">
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </button>
            <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#999] hover:text-[#e00] hover:bg-red-50 transition-colors" title="Kapat">
              <i className="fa-solid fa-xmark text-[10px]"></i>
            </button>
          </div>
        </div>

        {/* Options */}
        {showOptions && (
          <div className="mx-4 mt-1 mb-1 border border-[#eaeaea] rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="px-3 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {/* Filter mode */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-[#999]">Mod</span>
                <div className="inline-flex rounded-lg border border-[#eaeaea] p-[2px]">
                  {(['cumulative', 'range'] as FilterMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setFilterMode(m)}
                      className={`text-[10px] font-medium px-2.5 py-1 rounded-md ${
                        filterMode === m ? 'bg-[#171717] text-white' : 'text-[#999] hover:text-[#171717]'
                      }`}
                    >
                      {m === 'cumulative' ? 'Kümülatif' : 'Aralık'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time step */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-[#999]">Adım</span>
                <div className="inline-flex rounded-lg border border-[#eaeaea] p-[2px]">
                  {(['hour', 'day', 'week', 'month', 'year'] as TimeStep[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setTimeStep(s)}
                      className={`text-[10px] font-medium px-2 py-1 rounded-md transition-all ${
                        timeStep === s ? 'bg-[#171717] text-white' : 'text-[#999] hover:text-[#171717]'
                      }`}
                    >
                      {STEP_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-[#999]">Hız</span>
                <select
                  value={playSpeed}
                  onChange={e => setPlaySpeed(Number(e.target.value))}
                  className="text-[10px] font-medium border border-[#eaeaea] rounded-lg px-2 py-1 text-[#171717] bg-white focus:outline-none focus:border-[#171717] cursor-pointer"
                >
                  {SPEED_OPTIONS.map(s => (
                    <option key={s.ms} value={s.ms}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Numeric filter */}
            {availableNumericFields.length > 0 && (
              <div className="px-3 pb-2.5 pt-0 border-t border-[#eaeaea]">
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-medium text-[#999] whitespace-nowrap">Değer</span>
                  <select
                    value={numericFilter?.field ?? ''}
                    onChange={e => handleNumField(e.target.value)}
                    className="text-[10px] border border-[#eaeaea] rounded-lg px-2 py-1 text-[#666] bg-white focus:outline-none focus:border-[#171717] max-w-[120px] transition-colors"
                  >
                    <option value="">Seçiniz...</option>
                    {availableNumericFields.map(f => (
                      <option key={f} value={f}>{f}{getUnit(f) ? ` (${getUnit(f)})` : ''}</option>
                    ))}
                  </select>
                  {numericFilter && (
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[10px] font-medium text-[#171717] tabular-nums">
                        {numericFilter.currentMin.toFixed(1)}{numericFilter.unit}
                      </span>
                      <div className="flex-1">
                        <DualSlider
                          min={numericFilter.min} max={numericFilter.max}
                          start={numericFilter.currentMin} end={numericFilter.currentMax}
                          onChange={(s, e) => updateNumericRange(s, e)} dual
                        />
                      </div>
                      <span className="text-[10px] font-medium text-[#171717] tabular-nums">
                        {numericFilter.currentMax.toFixed(1)}{numericFilter.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Slider */}
        <div className="mx-4 mt-1">
          <DualSlider
            min={rangeMin} max={rangeMax}
            start={rangeMin} end={currentEnd}
            onChange={(_s, e) => setCurrentEnd(e)}
            dual={false}
          />
        </div>

        {/* Date labels */}
        <div className="flex items-center justify-between mx-4 -mt-0.5">
          <span className="text-[10px] text-[#999] tabular-nums">{fmtDate(rangeMin, timeStep)}</span>
          <div className="flex items-center gap-1.5">
            {filterMode === 'range' && (
              <>
                <span className="text-[10px] text-[#999] tabular-nums">{fmtDate(effectiveStart, timeStep)}</span>
                <span className="text-[10px] text-[#ccc]">→</span>
              </>
            )}
            <span className="text-[11px] font-semibold text-[#171717] tabular-nums bg-[#fafafa] border border-[#eaeaea] px-2 py-0.5 rounded-md">{fmtDate(currentEnd, timeStep)}</span>
          </div>
          <span className="text-[10px] text-[#999] tabular-nums">{fmtDate(rangeMax, timeStep)}</span>
        </div>

        {/* Transport */}
        <div className="flex items-center justify-center gap-0.5 px-4 pt-2 pb-3">
          <button onClick={jumpToStart} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#171717] hover:bg-[#fafafa] transition-colors" title="Başa Dön">
            <i className="fa-solid fa-backward-fast text-xs"></i>
          </button>
          <button onClick={stepBackward} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#171717] hover:bg-[#fafafa] transition-colors" title="Önceki">
            <i className="fa-solid fa-backward-step text-xs"></i>
          </button>
          <button
            onClick={togglePlay}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mx-1 transition-all hover:opacity-90 active:scale-95 ${
              isPlaying ? 'bg-[#f5a623]' : 'bg-[#171717]'
            }`}
            title={isPlaying ? 'Durdur' : 'Oynat'}
          >
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm ${!isPlaying ? 'ml-0.5' : ''}`}></i>
          </button>
          <button onClick={stepForward} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#171717] hover:bg-[#fafafa] transition-colors" title="Sonraki">
            <i className="fa-solid fa-forward-step text-xs"></i>
          </button>
          <button onClick={jumpToEnd} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#171717] hover:bg-[#fafafa] transition-colors" title="Sona Git">
            <i className="fa-solid fa-forward-fast text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
