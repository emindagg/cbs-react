/**
 * DynamicLegend
 *
 * Drop-in replacement for the old Legend component.
 * Always renders horizontally with:
 *   • A color bar (steps or continuous) on top
 *   • Boundary-aligned smart labels below
 *   • Automatic collision detection (stagger / thin)
 *   • Drag & drop repositioning
 *   • Inline title editing
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { coerceNumberFormat, formatNumber } from '@/utils/numberFormatter'

import './DynamicLegend.css'
import type { DynamicLegendProps } from '../types'
import LegendBar from './LegendBar'
import LegendLabels from './LegendLabels'

export default function DynamicLegend({
  config,
  breaks: rawBreaks,
  colors,
  scaleType,
  classificationMethod,
  onHover: _onHover,
  onTitleChange,
  fillOpacity,
}: DynamicLegendProps) {
  // ── Drag state ──────────────────────────────────────────────
  const legendRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // ── Derived data ────────────────────────────────────────────
  const breaks = useMemo(() => [...rawBreaks].sort((a, b) => a - b), [rawBreaks])
  const width = config.size // The "size" slider already controls legend width

  // Reverse colors if reverseOrder is enabled
  const displayColors = useMemo(
    () => (config.reverseOrder ? [...colors].reverse() : colors),
    [colors, config.reverseOrder],
  )

  // Label formatter using the config's number format
  const fmt = useCallback(
    (v: number) => formatNumber(v, coerceNumberFormat(config.format)),
    [config.format],
  )

  // Focus title input when entering edit mode (hooks must be before any return)
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: MouseEvent) => {
      const x = e.clientX - dragOffset.x
      const y = e.clientY - dragOffset.y
      const maxX = window.innerWidth - (legendRef.current?.offsetWidth || 0)
      const maxY = window.innerHeight - (legendRef.current?.offsetHeight || 0)
      setPosition({
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
      })
    }

    const handleUp = () => setIsDragging(false)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, dragOffset])

  // ── Visibility guard ────────────────────────────────────────
  if (!config.visible) return null
  if (colors.length === 0 || breaks.length === 0) return null

  // ── Position classes (same as old Legend) ────────────────────
  const positionClasses: Record<string, string> = {
    'above': 'top-3 left-1/2 -translate-x-1/2',
    'below': 'bottom-3 left-1/2 -translate-x-1/2',
    'inside-left-top': 'top-3 left-3',
    'inside-center-top': 'top-3 left-1/2 -translate-x-1/2',
    'inside-right-top': 'top-3 right-3',
    'inside-left-bottom': 'bottom-3 left-3',
    'inside-center-bottom': 'bottom-3 left-1/2 -translate-x-1/2',
    'inside-right-bottom': 'bottom-3 right-3',
  }

  // ── Title editing ───────────────────────────────────────────
  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onTitleChange) setIsEditingTitle(true)
  }

  const finishTitleEdit = () => setIsEditingTitle(false)

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') finishTitleEdit()
  }

  // ── Drag handlers ───────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditingTitle) return
    if (!legendRef.current) return
    const rect = legendRef.current.getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setIsDragging(true)
  }

  const showRangeList =
    scaleType === 'steps' && (config.labels.type === 'ranges' || config.labels.type === 'custom')

  // ── Render ──────────────────────────────────────────────────
  return (
    <div
      ref={legendRef}
      onMouseDown={handleMouseDown}
      className={`
        dynamic-legend
        fixed z-[1000] rounded-lg p-3
        ${position ? '' : (positionClasses[config.position] || positionClasses['above'])}
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        select-none
      `}
      style={{
        '--legend-width': `${width}px`,
        '--title-font-size': `${config.title?.fontSize || 16}px`,
        ...(position
          ? { left: `${position.x}px`, top: `${position.y}px`, transform: 'none' }
          : {}),
      } as React.CSSProperties}
    >
      {/* ── Title ──────────────────────────────────────────── */}
      {config.title?.show && (
        <div className="dynamic-legend__header">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={config.title.text || ''}
              onChange={(e) => onTitleChange?.(e.target.value)}
              onBlur={finishTitleEdit}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              placeholder="Lejant ismi giriniz"
              className="dynamic-legend__title-input"
            />
          ) : (
            <div
              onDoubleClick={handleTitleDoubleClick}
              className={`dynamic-legend__title ${onTitleChange ? 'dynamic-legend__title--editable' : ''}`}
            >
              {config.title.text || 'Lejant ismi giriniz'}
            </div>
          )}
        </div>
      )}

      {/* ── Color bar — ruler mode only for steps ───────────── */}
      {!showRangeList && (
        <LegendBar
          mode={scaleType}
          colors={displayColors}
          breaks={breaks}
          width={width}
          fillOpacity={fillOpacity}
        />
      )}

      {/* ── Boundary-aligned labels ────────────────────────── */}
      <LegendLabels
        breaks={breaks}
        colors={displayColors}
        width={width}
        formatLabel={fmt}
        mode={scaleType}
        classificationMethod={classificationMethod}
        labelType={config.labels.type}
        customLabels={config.labels.customLabels}
        reverseOrder={config.reverseOrder}
        fillOpacity={fillOpacity}
      />
    </div>
  )
}
