import { useCallback, useEffect, useRef, useState } from 'react'

import { getRampColors } from '../services/InterpolationRenderer'
import type {
  InterpolationConfig,
  InterpolationLegendSettings,
  InterpolationResult,
} from '../types'

interface InterpolationLegendProps {
  isActive: boolean
  result: InterpolationResult | null
  error: string | null
  config: InterpolationConfig
  legend: InterpolationLegendSettings
  setLegendTitle: (title: string | null) => void
  setLegendPosition: (position: { x: number; y: number } | null) => void
}

function formatLegendNumber(n: number): string {
  if (!isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1000) return n.toFixed(0)
  if (abs >= 100) return n.toFixed(1)
  if (abs >= 1) return n.toFixed(2)
  if (abs >= 0.01) return n.toFixed(3)
  if (abs === 0) return '0'
  return n.toExponential(2)
}

const LEGEND_WIDTH = 240
const MARGIN = 8

export default function InterpolationLegend({
  isActive,
  result,
  error,
  config,
  legend,
  setLegendTitle,
  setLegendPosition,
}: InterpolationLegendProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
    active: boolean
  } | null>(null)

  // İlk render veya pozisyon yoksa varsayılan konum: alt orta
  const defaultPosition = useCallback(() => {
    const width = containerRef.current?.offsetWidth ?? LEGEND_WIDTH
    const height = containerRef.current?.offsetHeight ?? 92
    return {
      x: Math.max(MARGIN, Math.round((window.innerWidth - width) / 2)),
      y: Math.max(MARGIN, window.innerHeight - height - 32),
    }
  }, [])

  // Pozisyonu viewport dışına düşmesin diye kırpar
  const clampPosition = useCallback(
    (pos: { x: number; y: number }) => {
      const el = containerRef.current
      const width = el?.offsetWidth ?? LEGEND_WIDTH
      const height = el?.offsetHeight ?? 92
      const maxX = Math.max(MARGIN, window.innerWidth - width - MARGIN)
      const maxY = Math.max(MARGIN, window.innerHeight - height - MARGIN)
      return {
        x: Math.min(Math.max(MARGIN, pos.x), maxX),
        y: Math.min(Math.max(MARGIN, pos.y), maxY),
      }
    },
    [],
  )

  // Viewport yeniden boyutlandırılırsa lejantı içeri çek
  useEffect(() => {
    const handleResize = () => {
      if (!legend.position) return
      setLegendPosition(clampPosition(legend.position))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [legend.position, setLegendPosition, clampPosition])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isEditingTitle) return
      // Sadece başlık çubuğu dışında (ör. input) sürüklemeyi başlatma
      const target = e.target as HTMLElement
      if (target.closest('input, button')) return

      const origin = legend.position ?? defaultPosition()
      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: origin.x,
        originY: origin.y,
        active: true,
      }
      setIsDragging(true)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      e.preventDefault()
    },
    [isEditingTitle, legend.position, defaultPosition],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current
      if (!state?.active) return
      const next = clampPosition({
        x: state.originX + (e.clientX - state.startX),
        y: state.originY + (e.clientY - state.startY),
      })
      setLegendPosition(next)
    },
    [clampPosition, setLegendPosition],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current
      if (!state) return
      state.active = false
      dragStateRef.current = null
      setIsDragging(false)
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        // pointer yakalama zaten serbest bırakılmış olabilir
      }
    },
    [],
  )

  const startEditTitle = useCallback(() => {
    setTitleDraft(legend.title ?? result?.valueColumn ?? '')
    setIsEditingTitle(true)
  }, [legend.title, result])

  const commitTitle = useCallback(() => {
    const trimmed = titleDraft.trim()
    setLegendTitle(trimmed ? trimmed : null)
    setIsEditingTitle(false)
  }, [titleDraft, setLegendTitle])

  if (!isActive || !result || error) return null

  const { min, max } = result
  const isClassified = config.symbology === 'classify'
  const stops = isClassified ? Math.max(3, Math.min(config.classCount, 15)) : 7
  const colors = getRampColors(config.colorRamp, stops)

  const background = isClassified
    ? `linear-gradient(to right, ${colors
        .map((c, i) => {
          const start = (i / stops) * 100
          const end = ((i + 1) / stops) * 100
          return `${c} ${start}%, ${c} ${end}%`
        })
        .join(',')})`
    : `linear-gradient(to right, ${colors.join(',')})`

  const pos = legend.position ?? defaultPosition()
  const title = legend.title ?? result.valueColumn

  const cursor = isEditingTitle ? 'default' : isDragging ? 'grabbing' : 'grab'

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        left: pos.x,
        top: pos.y,
        width: LEGEND_WIDTH,
        touchAction: 'none',
        cursor,
      }}
      className={`fixed z-[1400] bg-white/95 backdrop-blur rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-zinc-200 px-3 py-2.5 select-none ${
        isDragging ? '' : 'animate-in fade-in duration-150'
      }`}
    >
      {/* Başlık çubuğu */}
      <div className="flex items-center justify-between mb-1.5 gap-2">
        {isEditingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') setIsEditingTitle(false)
            }}
            className="flex-1 min-w-0 text-[10px] font-semibold text-zinc-800 bg-zinc-50 border border-indigo-300 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500"
          />
        ) : (
          <button
            onClick={startEditTitle}
            title="Başlığı düzenle"
            disabled={isDragging}
            className={`flex-1 min-w-0 text-left text-[10px] font-semibold text-zinc-700 truncate rounded px-1 py-0.5 ${
              isDragging
                ? 'pointer-events-none'
                : 'hover:text-indigo-600 hover:bg-zinc-50 transition-colors'
            }`}
          >
            {title}
          </button>
        )}
      </div>

      <div
        className="h-2.5 rounded-full border border-black/5"
        style={{ background }}
      />

      <div className="flex justify-between mt-1 text-[9px] text-zinc-600 font-mono">
        <span>{formatLegendNumber(min)}</span>
        <span>{formatLegendNumber((min + max) / 2)}</span>
        <span>{formatLegendNumber(max)}</span>
      </div>
    </div>
  )
}
