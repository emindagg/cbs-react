/**
 * BubbleSizeLegend — ArcGIS-style nested circles legend
 *
 * Shows 3 concentric circles (min, mid, max) with value labels
 * to indicate what bubble sizes represent.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { formatNumber, type NumberFormat } from '@/utils/numberFormatter'

import type { LegendConfiguration } from '../types'

interface BubbleSizeLegendProps {
  config: LegendConfiguration
  minValue: number
  maxValue: number
  minRadius: number
  maxRadius: number
  onTitleChange?: (title: string) => void
}

export default function BubbleSizeLegend({
  config,
  minValue,
  maxValue,
  minRadius,
  maxRadius,
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

  // 3 levels: max, mid, min
  const midValue = (minValue + maxValue) / 2
  const midRadius = (minRadius + maxRadius) / 2

  // SVG dimensions — based on the largest circle
  const padding = 4
  const labelWidth = 70
  const svgWidth = maxRadius * 2 + labelWidth + padding * 2
  const svgHeight = maxRadius * 2 + padding * 2

  const circles = [
    { value: maxValue, radius: maxRadius, label: fmt(maxValue) },
    { value: midValue, radius: midRadius, label: fmt(midValue) },
    { value: minValue, radius: minRadius, label: fmt(minValue) },
  ]

  // All circles bottom-aligned
  const bottomY = svgHeight - padding

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

      {/* Nested circles SVG */}
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ display: 'block' }}
      >
        {circles.map((c, i) => {
          const cy = bottomY - c.radius
          const cx = padding + maxRadius

          return (
            <g key={i}>
              {/* Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={c.radius}
                fill="none"
                stroke="#666"
                strokeWidth={1}
                strokeDasharray={i === 0 ? 'none' : '3,2'}
                opacity={0.8}
              />
              {/* Dashed line from top of circle to label area */}
              <line
                x1={cx}
                y1={cy - c.radius}
                x2={padding + maxRadius * 2 + 6}
                y2={cy - c.radius}
                stroke="#999"
                strokeWidth={0.8}
                strokeDasharray="2,2"
              />
              {/* Value label */}
              <text
                x={padding + maxRadius * 2 + 10}
                y={cy - c.radius + 4}
                fontSize={11}
                fill="#444"
                fontFamily="system-ui, sans-serif"
              >
                {c.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
