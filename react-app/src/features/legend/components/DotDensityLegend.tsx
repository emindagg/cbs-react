/**
 * DotDensityLegend — "1 nokta = X birim" lejantı
 *
 * Choropleth renk skalası yerine, tek bir nokta sembolü ve
 * dot value açıklaması gösterir.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { coerceNumberFormat, formatNumber } from '@/utils/numberFormatter'

import type { LegendConfiguration } from '../types'

interface DotDensityLegendProps {
  config: LegendConfiguration
  dotColor: string
  dotSize: number
  dotValue: number
  dotLabel?: string
  onTitleChange?: (title: string) => void
}

export default function DotDensityLegend({
  config,
  dotColor,
  dotSize,
  dotValue,
  dotLabel,
  onTitleChange,
}: DotDensityLegendProps) {
  const legendRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const fmt = useCallback(
    (v: number) => formatNumber(v, coerceNumberFormat(config.format)),
    [config.format],
  )

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

  if (!config.visible) return null

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

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onTitleChange) setIsEditingTitle(true)
  }

  const finishTitleEdit = () => setIsEditingTitle(false)

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') finishTitleEdit()
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditingTitle) return
    if (!legendRef.current) return
    const rect = legendRef.current.getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setIsDragging(true)
  }

  // Dot symbol size in legend: clamp between 6-16px for readability
  const legendDotSize = Math.max(6, Math.min(dotSize * 3, 16))

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
        ...(position
          ? { left: `${position.x}px`, top: `${position.y}px`, transform: 'none' }
          : {}),
      }}
    >
      {/* Title */}
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
              {config.title.text || 'Lejant'}
            </div>
          )}
        </div>
      )}

      {/* Dot density legend: "● 1 nokta = X birim" */}
      <div className="flex items-center gap-2 mt-1">
        <span
          className="inline-block rounded-full border border-white/60 flex-shrink-0"
          style={{
            width: legendDotSize,
            height: legendDotSize,
            backgroundColor: dotColor,
            boxShadow: '0 0 0 0.5px rgba(255,255,255,0.6)',
          }}
        />
        <span
          className="text-[13px] font-medium text-gray-700 whitespace-nowrap"
        >
          1 nokta = {fmt(dotValue)}{dotLabel ? ` ${dotLabel}` : ''}
        </span>
      </div>
    </div>
  )
}
