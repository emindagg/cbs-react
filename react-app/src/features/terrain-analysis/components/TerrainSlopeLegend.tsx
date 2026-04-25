import { useCallback, useEffect, useRef, useState } from 'react'

import type { TerrainSlopeResult } from '../types'

interface TerrainSlopeLegendProps {
  result: TerrainSlopeResult
  onClose?: () => void
}

const LEGEND_WIDTH = 260
const LEGEND_DEFAULT_BOTTOM_OFFSET = 24
const ESTIMATED_LEGEND_HEIGHT = 280
const PERCENT_MULTIPLIER = 100

function formatNumber(value: number, fractionDigits = 1): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export default function TerrainSlopeLegend({
  result,
  onClose,
}: TerrainSlopeLegendProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [pos, setPos] = useState(() => ({
    x: Math.max(8, window.innerWidth / 2 - LEGEND_WIDTH / 2),
    y: Math.max(8, window.innerHeight - ESTIMATED_LEGEND_HEIGHT - LEGEND_DEFAULT_BOTTOM_OFFSET),
  }))
  const isDragging = useRef(false)
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => ({
        x: Math.min(prev.x, window.innerWidth - LEGEND_WIDTH - 8),
        y: Math.min(prev.y, window.innerHeight - 80),
      }))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [pos])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragOrigin.current.mx
    const dy = e.clientY - dragOrigin.current.my
    const newX = dragOrigin.current.px + dx
    const newY = dragOrigin.current.py + dy
    const clampedX = Math.max(8, Math.min(newX, window.innerWidth - LEGEND_WIDTH - 8))
    const clampedY = Math.max(8, Math.min(newY, window.innerHeight - 60))
    setPos({ x: clampedX, y: clampedY })
  }, [])

  const onPointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: LEGEND_WIDTH,
        zIndex: 1400,
      }}
      className="bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-100 overflow-hidden select-none"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        className="px-3 py-2 bg-gradient-to-r from-red-50 to-amber-50 border-b border-zinc-100 flex items-center justify-between"
      >
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-grip-vertical text-zinc-400 text-[9px]"></i>
          <h4 className="text-[11px] font-bold text-zinc-800">Eğim Lejantı</h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setCollapsed((prev) => !prev)}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/60 text-zinc-500 hover:text-zinc-700"
            title={collapsed ? 'Genişlet' : 'Daralt'}
          >
            <i className={`fa-solid ${collapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[9px]`}></i>
          </button>
          {onClose && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/60 text-zinc-500 hover:text-zinc-700"
              title="Lejantı kapat"
            >
              <i className="fa-solid fa-xmark text-[9px]"></i>
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="px-3 py-2.5 space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-zinc-50 rounded-md px-2 py-1">
              <div className="text-[8px] text-zinc-500">Ort.</div>
              <div className="text-[10px] font-bold text-zinc-800">%{formatNumber(result.avgSlopePercent)}</div>
            </div>
            <div className="bg-zinc-50 rounded-md px-2 py-1">
              <div className="text-[8px] text-zinc-500">Min</div>
              <div className="text-[10px] font-bold text-zinc-800">%{formatNumber(result.minSlopePercent)}</div>
            </div>
            <div className="bg-zinc-50 rounded-md px-2 py-1">
              <div className="text-[8px] text-zinc-500">Max</div>
              <div className="text-[10px] font-bold text-zinc-800">%{formatNumber(result.maxSlopePercent)}</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[9px] font-bold text-zinc-700 mb-1">Eğim Sınıfları</div>
            {(() => {
              const totalPixels = result.classes.reduce((sum, c) => sum + c.pixelCount, 0)
              return result.classes.map((item) => {
                const ratio = totalPixels > 0 ? item.pixelCount / totalPixels : 0
                const areaKm2 = ratio * result.areaKm2
                const percent = ratio * PERCENT_MULTIPLIER
                return (
                  <div key={item.label} className="flex items-center gap-2 text-[9px] text-zinc-700">
                    <span className="w-4 h-3 rounded-sm border border-zinc-300 shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium truncate" title={item.label}>{item.label}</span>
                    <span className="ml-auto text-zinc-500 tabular-nums whitespace-nowrap">
                      %{formatNumber(percent, 1)} · {formatNumber(areaKm2, 2)} km²
                    </span>
                  </div>
                )
              })
            })()}
          </div>

          <div className="text-[8px] text-zinc-400 border-t border-zinc-100 pt-1.5 flex items-center justify-between">
            <span>z{result.tileZoom} · ~{formatNumber(result.resolutionMeters, 0)} m/px</span>
            <span>{result.estimatedTiles} tile</span>
          </div>
        </div>
      )}
    </div>
  )
}
