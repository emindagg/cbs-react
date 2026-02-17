/**
 * Reusable Slider Components
 * Built on rc-slider for accessibility and reliability
 */

import RcSlider from 'rc-slider'
import 'rc-slider/assets/index.css'

const trackStyle = { backgroundColor: '#27272a', height: 2 }
const railStyle = { backgroundColor: '#e4e4e7', height: 2 }
const handleStyle = {
  width: 13,
  height: 13,
  marginTop: -5.5,
  borderColor: '#27272a',
  borderWidth: 2,
  backgroundColor: 'white',
  opacity: 1,
  boxShadow: 'none',
}

/* ────────────────────────────────────────────
 * SingleSlider — tek tutamaçlı slider
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

export function SingleSlider({ label, min, max, step, value, formatValue, onChange }: SingleSliderProps) {
  const display = formatValue ? formatValue(value) : String(value)

  return (
    <div>
      <label className="block text-[10px] font-medium text-zinc-600 mb-1.5">
        {label}
        <span className="ml-1 text-zinc-400 font-normal">{display}</span>
      </label>
      <RcSlider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(v) => onChange(v as number)}
        styles={{ track: trackStyle, rail: railStyle, handle: handleStyle }}
      />
    </div>
  )
}

/* ────────────────────────────────────────────
 * DualRangeSlider — çift tutamaçlı slider
 * ──────────────────────────────────────────── */
interface DualRangeSliderProps {
  label: string
  min: number
  max: number
  valueMin: number
  valueMax: number
  formatValue?: (min: number, max: number) => string
  onChangeMin: (v: number) => void
  onChangeMax: (v: number) => void
}

export function DualRangeSlider({
  label,
  min,
  max,
  valueMin,
  valueMax,
  formatValue,
  onChangeMin,
  onChangeMax,
}: DualRangeSliderProps) {
  const display = formatValue ? formatValue(valueMin, valueMax) : `${valueMin} – ${valueMax}`

  return (
    <div>
      <label className="block text-[10px] font-medium text-zinc-600 mb-1.5">
        {label}
        <span className="ml-1 text-zinc-400 font-normal">{display}</span>
      </label>
      <RcSlider
        range
        min={min}
        max={max}
        value={[valueMin, valueMax]}
        onChange={(v) => {
          const [newMin, newMax] = v as number[]
          onChangeMin(newMin)
          onChangeMax(newMax)
        }}
        styles={{ track: trackStyle, rail: railStyle, handle: handleStyle }}
      />
    </div>
  )
}

/* ────────────────────────────────────────────
 * SliderWithInput — slider + number input
 * ──────────────────────────────────────────── */
interface SliderWithInputProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  unit?: string
  onChange: (v: number) => void
}

export function SliderWithInput({ label, min, max, step, value, unit = 'px', onChange }: SliderWithInputProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-medium text-zinc-600">{label}</label>
        <span className="text-[10px] text-zinc-400">{value}{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <RcSlider
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(v) => onChange(v as number)}
            styles={{ track: trackStyle, rail: railStyle, handle: handleStyle }}
          />
        </div>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value)
            if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)))
          }}
          className="w-14 px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 text-center"
        />
      </div>
    </div>
  )
}
