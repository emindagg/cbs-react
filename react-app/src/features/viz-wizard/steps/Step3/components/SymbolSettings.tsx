/**
 * Bubble / symbol map ayarları (VizWizardStep3 içinde kullanılır)
 */

import { useCallback, useRef } from 'react'

import type { SymbolScaling, VisualizationSettings } from '@/types/visualization'

/* ── Dual-handle range slider sabitleri ── */
const SIZE_MIN = 2
const SIZE_MAX = 80

const SCALING_OPTIONS: { value: SymbolScaling; label: string; description: string }[] = [
  { value: 'sqrt', label: 'Karekök', description: 'Alan-orantılı (varsayılan)' },
  { value: 'flannery', label: 'Flannery', description: 'Algısal telafi (^0.57)' },
  { value: 'linear', label: 'Doğrusal', description: 'Yarıçap-orantılı' },
  { value: 'log', label: 'Logaritmik', description: 'Geniş aralıklar için' },
]

interface SymbolSettingsProps {
  vizSettings: VisualizationSettings
  setVizSettings: (s: Partial<VisualizationSettings>) => void
  /** Bivariate seçimi için mevcut sütunlar */
  columns?: string[]
  /** Şu anki veri sütunu (boyut için) */
  dataColumn?: string
}

export function SymbolSettings({
  vizSettings,
  setVizSettings,
  columns,
  dataColumn,
}: SymbolSettingsProps) {
  // Bivariate: renk sütunu seçenekleri (veri sütunu hariç)
  const colorColumnOptions = columns?.filter((c) => c !== dataColumn) ?? []

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
      <div className="text-[11px] font-semibold text-zinc-700 mb-2">
        Sembol Ayarları
      </div>

      {/* Scaling method */}
      <div>
        <label className="block text-[10px] font-medium text-zinc-600 mb-1">
          Boyut Ölçekleme
        </label>
        <select
          value={vizSettings.symbolScaling || 'sqrt'}
          onChange={(e) => setVizSettings({ symbolScaling: e.target.value as SymbolScaling })}
          className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {SCALING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} — {opt.description}
            </option>
          ))}
        </select>
      </div>

      {/* Bivariate: color column selection */}
      {colorColumnOptions.length > 0 && (
        <div>
          <label className="block text-[10px] font-medium text-zinc-600 mb-1">
            Renk Sütunu (Bivariate)
          </label>
          <select
            value={vizSettings.colorColumn || ''}
            onChange={(e) => setVizSettings({ colorColumn: e.target.value || undefined })}
            className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Boyut ile aynı sütun</option>
            {colorColumnOptions.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <p className="text-[9px] text-zinc-400 mt-0.5">
            Farklı sütun seçerek boyut ve rengi ayrı verilerle gösterebilirsiniz.
          </p>
        </div>
      )}

      {/* Dual-handle boyut slider */}
      <DualRangeSlider
        min={SIZE_MIN}
        max={SIZE_MAX}
        valueMin={vizSettings.symbolMinSize ?? 5}
        valueMax={vizSettings.symbolMaxSize ?? 40}
        onChangeMin={(v) => setVizSettings({ symbolMinSize: v })}
        onChangeMax={(v) => setVizSettings({ symbolMaxSize: v })}
      />

      {/* Kenar Kalınlığı slider */}
      <SingleSlider
        label="Kenar Kalınlığı"
        min={0}
        max={5}
        step={0.1}
        value={vizSettings.symbolStrokeWidth ?? 1.5}
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => setVizSettings({ symbolStrokeWidth: v })}
      />

      {/* Opaklık slider */}
      <SingleSlider
        label="Opaklık"
        min={0}
        max={1}
        step={0.05}
        value={vizSettings.symbolOpacity ?? 0.6}
        formatValue={(v) => `%${Math.round(v * 100)}`}
        onChange={(v) => setVizSettings({ symbolOpacity: v })}
      />

      <div>
        <label className="block text-[10px] font-medium text-zinc-600 mb-1">
          Kenar Rengi
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={vizSettings.symbolStrokeColor || '#ffffff'}
            onChange={(e) => setVizSettings({ symbolStrokeColor: e.target.value })}
            className="w-12 h-8 border border-zinc-200 rounded cursor-pointer"
          />
          <input
            type="text"
            value={vizSettings.symbolStrokeColor || '#ffffff'}
            onChange={(e) => {
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                setVizSettings({ symbolStrokeColor: e.target.value })
              }
            }}
            placeholder="#ffffff"
            className="flex-1 px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Outlier exclusion — */}
      <div>
        <label className="block text-[10px] font-medium text-zinc-600 mb-1">
          Aykırı Değer Filtresi
        </label>
        <select
          value={vizSettings.outlierExclusion || 'none'}
          onChange={(e) => setVizSettings({ outlierExclusion: e.target.value as 'none' | 'iqr' | 'iqr-strict' })}
          className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="none">Yok</option>
          <option value="iqr">IQR (1.5x) — Orta</option>
          <option value="iqr-strict">IQR (3x) — Sadece aşırılar</option>
        </select>
        <p className="text-[9px] text-zinc-400 mt-0.5">
          Uç değerleri otomatik hariç tutarak daha dengeli görselleştirme sağlar.
        </p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
 * SingleSlider — tek baklava (diamond) tutamaçlı
 * ──────────────────────────────────────────── */
interface SingleSliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  formatValue?: (v: number) => string
  onChange: (v: number) => void
}

function SingleSlider({ label, min, max, step, value, formatValue, onChange }: SingleSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const pct = ((value - min) / (max - min)) * 100

  const snap = useCallback(
    (raw: number) => Math.round(raw / step) * step,
    [step],
  )

  const resolveValue = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect) return null
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return snap(min + ratio * (max - min))
    },
    [min, max, snap],
  )

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      const v = resolveValue(e.clientX)
      if (v !== null) onChange(v)
    },
    [resolveValue, onChange],
  )

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const display = formatValue ? formatValue(value) : String(value)

  return (
    <div>
      <label className="block text-[10px] font-medium text-zinc-600 mb-1.5">
        {label}
        <span className="ml-1 text-zinc-400 font-normal">{display}</span>
      </label>
      <div
        ref={trackRef}
        className="relative h-5 select-none touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Arka plan çizgi */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-zinc-200 rounded-full" />
        {/* Aktif aralık */}
        <div
          className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-zinc-800 rounded-full"
          style={{ left: 0, right: `${100 - pct}%` }}
        />
        {/* Tutamaç (diamond) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
          style={{ left: `${pct}%` }}
          onPointerDown={onPointerDown}
        >
          <div className="w-[10px] h-[10px] rotate-45 border-[1.5px] border-zinc-800 bg-white" />
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
 * DualRangeSlider — baklava (diamond) tutamaçlı
 * ──────────────────────────────────────────── */
interface DualRangeSliderProps {
  min: number
  max: number
  valueMin: number
  valueMax: number
  onChangeMin: (v: number) => void
  onChangeMax: (v: number) => void
}

function DualRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
}: DualRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'min' | 'max' | null>(null)

  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const pctMin = pct(valueMin)
  const pctMax = pct(valueMax)

  const resolveValue = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect) return null
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return Math.round(min + ratio * (max - min))
    },
    [min, max],
  )

  const onPointerDown = useCallback(
    (handle: 'min' | 'max') => (e: React.PointerEvent) => {
      e.preventDefault()
      dragging.current = handle
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      const v = resolveValue(e.clientX)
      if (v === null) return
      if (dragging.current === 'min') {
        onChangeMin(Math.min(v, valueMax - 1))
      } else {
        onChangeMax(Math.max(v, valueMin + 1))
      }
    },
    [resolveValue, valueMin, valueMax, onChangeMin, onChangeMax],
  )

  const onPointerUp = useCallback(() => {
    dragging.current = null
  }, [])

  return (
    <div>
      <label className="block text-[10px] font-medium text-zinc-600 mb-1.5">
        Boyut Aralığı
        <span className="ml-1 text-zinc-400 font-normal">{valueMin} – {valueMax} px</span>
      </label>
      <div
        ref={trackRef}
        className="relative h-5 select-none touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Arka plan çizgi */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-zinc-200 rounded-full" />
        {/* Aktif aralık */}
        <div
          className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-zinc-800 rounded-full"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        {/* Min tutamacı (diamond) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
          style={{ left: `${pctMin}%` }}
          onPointerDown={onPointerDown('min')}
        >
          <div className="w-[10px] h-[10px] rotate-45 border-[1.5px] border-zinc-800 bg-white" />
        </div>
        {/* Max tutamacı (diamond) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
          style={{ left: `${pctMax}%` }}
          onPointerDown={onPointerDown('max')}
        >
          <div className="w-[10px] h-[10px] rotate-45 border-[1.5px] border-zinc-800 bg-white" />
        </div>
      </div>
    </div>
  )
}
