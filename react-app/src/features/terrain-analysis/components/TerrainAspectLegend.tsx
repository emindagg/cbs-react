import { useMemo, useState } from 'react'

import { useDraggable } from '@/hooks'

import { ASPECT_CLASS_DEFINITIONS } from '../services/aspectClasses'
import { computeDirectionGroups } from '../services/aspectGrouping'
import type { TerrainAspectResult } from '../types'

interface TerrainAspectLegendProps {
  result: TerrainAspectResult
  onClose?: () => void
}

const LEGEND_WIDTH = 260
const LEGEND_DEFAULT_BOTTOM_OFFSET = 24
const LEGEND_DEFAULT_LEFT_OFFSET = 24
const ESTIMATED_LEGEND_HEIGHT = 320
const PERCENT_MULTIPLIER = 100

function formatNumber(value: number, fractionDigits = 1): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

interface ClassRow {
  label: string
  color: string
  percent: number
  areaKm2: number
}

function computeClassRows(result: TerrainAspectResult): ClassRow[] {
  const totalPixels = result.classes.reduce((sum, c) => sum + c.pixelCount, 0)
  return result.classes.map((item) => {
    const ratio = totalPixels > 0 ? item.pixelCount / totalPixels : 0
    return {
      label: item.label,
      color: item.color,
      percent: ratio * PERCENT_MULTIPLIER,
      areaKm2: ratio * result.areaKm2,
    }
  })
}

function findDominantLabel(directionKey: string): string {
  const def = ASPECT_CLASS_DEFINITIONS.find((item) => item.direction === directionKey)
  return def?.label ?? '—'
}

export default function TerrainAspectLegend({
  result,
  onClose,
}: TerrainAspectLegendProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [groupSummaryOpen, setGroupSummaryOpen] = useState(false)

  const { position, isDragging, handlers } = useDraggable({
    initial: () => ({
      x: LEGEND_DEFAULT_LEFT_OFFSET,
      y: Math.max(8, window.innerHeight - ESTIMATED_LEGEND_HEIGHT - LEGEND_DEFAULT_BOTTOM_OFFSET),
    }),
    width: LEGEND_WIDTH,
    height: ESTIMATED_LEGEND_HEIGHT,
  })

  const classRows = useMemo(() => computeClassRows(result), [result])
  const directionGroups = useMemo(() => computeDirectionGroups(result), [result])
  const dominantLabel = findDominantLabel(result.dominantDirection)

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: LEGEND_WIDTH,
        zIndex: 1400,
      }}
      className="bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-100 overflow-hidden select-none"
    >
      <div
        {...handlers}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        className="px-3 py-2 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-b border-zinc-100 flex items-center justify-between"
      >
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-grip-vertical text-zinc-400 text-[9px]"></i>
          <h4 className="text-[11px] font-bold text-zinc-800">Bakı Lejantı</h4>
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
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-zinc-50 rounded-md px-2 py-1">
              <div className="text-[8px] text-zinc-500">Baskın Yön</div>
              <div className="text-[10px] font-bold text-violet-800">{dominantLabel}</div>
            </div>
            <div className="bg-zinc-50 rounded-md px-2 py-1">
              <div className="text-[8px] text-zinc-500">Düz Alan</div>
              <div className="text-[10px] font-bold text-zinc-800">%{formatNumber(result.flatPercent)}</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[9px] font-bold text-zinc-700 mb-1">Bakı Yönleri</div>
            {classRows.map((row) => (
              <div key={row.label} className="flex items-center gap-2 text-[9px] text-zinc-700">
                <span className="w-4 h-3 rounded-sm border border-zinc-300 shrink-0" style={{ backgroundColor: row.color }} />
                <span className="font-medium truncate" title={row.label}>{row.label}</span>
                <span className="ml-auto text-zinc-500 tabular-nums whitespace-nowrap">
                  %{formatNumber(row.percent, 1)} · {formatNumber(row.areaKm2, 2)} km²
                </span>
              </div>
            ))}
          </div>

          <div className="text-[8px] text-zinc-400 border-t border-zinc-100 pt-1.5">
            <span>z{result.tileZoom} · ~{formatNumber(result.resolutionMeters, 0)} m/px</span>
          </div>

          <div className="border-t border-zinc-100 -mx-3 px-3 pt-1.5">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setGroupSummaryOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-[9px] font-semibold text-zinc-700 hover:text-violet-700 transition-colors py-1"
              title={groupSummaryOpen ? 'Özeti gizle' : 'Yön gruplarını göster'}
            >
              <span>Yön Grupları</span>
              <i className={`fa-solid ${groupSummaryOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-[8px] text-zinc-400`}></i>
            </button>

            {groupSummaryOpen && (
              <div className="space-y-1.5 pt-1.5 pb-0.5">
                {directionGroups.map((group) => (
                  <div key={group.key} className="bg-zinc-50 rounded-md px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="flex gap-0.5 shrink-0">
                          {group.swatchColors.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-2 h-2 rounded-sm border border-zinc-300"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-800 truncate">{group.label}</span>
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-zinc-800 whitespace-nowrap">
                        %{formatNumber(group.percent)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[8px] text-zinc-500 truncate">{group.members}</span>
                      <span className="text-[8px] text-zinc-500 tabular-nums whitespace-nowrap">{formatNumber(group.areaKm2, 2)} km²</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
