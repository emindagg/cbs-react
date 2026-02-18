/**
 * BubbleSizeLegend — ArcGIS-style nested circles legend
 *
 * Shows concentric circles (3-7 adet) with value labels
 * to indicate what bubble sizes represent.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { formatNumber, type NumberFormat } from '@/utils/numberFormatter'

import type { LegendConfiguration } from '../types'

interface GraduatedClass {
  minVal: number
  maxVal: number
  radius: number
}

interface LegendCircle {
  value: number
  radius: number
}

interface BubbleSizeLegendProps {
  config: LegendConfiguration
  /** Proportional mod: max→min sıralı çemberler (dinamik sayı) */
  circles: LegendCircle[]
  /** Dolgu rengi (undefined = fill:none, yalnızca kontur) */
  bubbleColor?: string
  /** Graduated mod: sınıf bilgileri */
  graduatedClasses?: GraduatedClass[]
  onTitleChange?: (title: string) => void
}

export default function BubbleSizeLegend({
  config,
  circles,
  bubbleColor,
  graduatedClasses,
  onTitleChange,
}: BubbleSizeLegendProps) {
  const legendRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const fmt = useCallback(
    (v: number) => formatNumber(v, config.format as NumberFormat),
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

  // Derive maxRadius from circles (max→min sıralı, ilk eleman en büyük)
  const maxRadius = circles[0]?.radius
    ?? (graduatedClasses ? Math.max(...graduatedClasses.map((c) => c.radius)) : 20)

  // SVG width for rows — circles right-aligned (both graduated and proportional)
  const svgW = maxRadius * 2 + 4

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
              {config.title.text || 'Boyut'}
            </div>
          )}
        </div>
      )}

      {/* Graduated: rows of right-aligned circles with range labels */}
      {graduatedClasses ? (
        <div className="flex flex-col gap-1">
          {graduatedClasses.map((cls, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg
                width={svgW}
                height={cls.radius * 2 + 4}
                style={{ display: 'block', flexShrink: 0 }}
              >
                <circle
                  cx={svgW - cls.radius - 2}
                  cy={cls.radius + 2}
                  r={cls.radius}
                  fill="none"
                  stroke="#666"
                  strokeWidth={1}
                  opacity={0.8}
                />
              </svg>
              <span
                style={{ fontSize: 10, color: '#444', fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap' }}
              >
                {fmt(cls.minVal)} – {fmt(cls.maxVal)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Proportional: ayrı satırlar (max→min), right-aligned, değer etiketi */
        <div className="flex flex-col gap-1">
          {circles.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg
                width={svgW}
                height={c.radius * 2 + 4}
                style={{ display: 'block', flexShrink: 0 }}
              >
                <circle
                  cx={svgW - c.radius - 2}
                  cy={c.radius + 2}
                  r={c.radius}
                  fill={bubbleColor || 'none'}
                  fillOpacity={bubbleColor ? 0.65 : 0}
                  stroke={bubbleColor ? 'rgba(0,0,0,0.25)' : '#666'}
                  strokeWidth={1}
                  opacity={0.8}
                />
              </svg>
              <span
                style={{ fontSize: 10, color: '#444', fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap' }}
              >
                {fmt(c.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
