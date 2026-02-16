/**
 * Reusable Slider Components
 * Shared UI components for single and dual-handle sliders
 */

import { useCallback, useRef } from 'react'

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
            ; (e.target as HTMLElement).setPointerCapture(e.pointerId)
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
                {/* Tutamaç (circle) */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                    style={{ left: `${pct}%` }}
                    onPointerDown={onPointerDown}
                >
                    <div className="w-[13px] h-[13px] rounded-full border-[2px] border-zinc-800 bg-white" />
                </div>
            </div>
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
                ; (e.target as HTMLElement).setPointerCapture(e.pointerId)
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

    const display = formatValue ? formatValue(valueMin, valueMax) : `${valueMin} – ${valueMax}`

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
                    style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
                />
                {/* Min tutamacı (circle) */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                    style={{ left: `${pctMin}%` }}
                    onPointerDown={onPointerDown('min')}
                >
                    <div className="w-[13px] h-[13px] rounded-full border-[2px] border-zinc-800 bg-white" />
                </div>
                {/* Max tutamacı (circle) */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                    style={{ left: `${pctMax}%` }}
                    onPointerDown={onPointerDown('max')}
                >
                    <div className="w-[13px] h-[13px] rounded-full border-[2px] border-zinc-800 bg-white" />
                </div>
            </div>
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
            return Math.max(min, Math.min(max, snap(min + ratio * (max - min))))
        },
        [min, max, snap],
    )

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        dragging.current = true
            ; (e.target as HTMLElement).setPointerCapture(e.pointerId)
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

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-medium text-zinc-600">{label}</label>
                <span className="text-[10px] text-zinc-400">{value}{unit}</span>
            </div>
            <div className="flex items-center gap-2">
                <div
                    ref={trackRef}
                    className="relative h-5 flex-1 select-none touch-none"
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                >
                    {/* Background track */}
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-zinc-200 rounded-full" />
                    {/* Active range */}
                    <div
                        className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-zinc-800 rounded-full"
                        style={{ left: 0, right: `${100 - pct}%` }}
                    />
                    {/* Circle thumb */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                        style={{ left: `${pct}%` }}
                        onPointerDown={onPointerDown}
                    >
                        <div className="w-[13px] h-[13px] rounded-full border-[2px] border-zinc-800 bg-white" />
                    </div>
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
