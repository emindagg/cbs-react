/**
 * Datawrapper-style Legend Component
 * Flexible legend with position, orientation, and format options
 */

import { useState, useRef, useEffect } from 'react'

import type { LegendConfiguration, ColorScaleType } from '../../types/visualization'
import { formatNumber, type NumberFormat } from '../../utils/numberFormatter'

interface LegendProps {
  config: LegendConfiguration;
  breaks: number[];
  colors: string[];
  scaleType: ColorScaleType;
  onHover?: (index: number | null) => void;
  onTitleChange?: (title: string) => void;
}

export default function Legend({
  config,
  breaks,
  colors,
  scaleType,
  onHover,
  onTitleChange,
}: LegendProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const legendRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  if (!config.visible) return null

  const handleItemHover = (index: number | null) => {
    if (config.highlightOnHover) {
      setHoveredIndex(index)
      onHover?.(index)
    }
  }

  // Title editing handlers
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onTitleChange) {
      setIsEditingTitle(true)
    }
  }

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false)
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
    }
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditingTitle) return
    if (!legendRef.current) return

    const rect = legendRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const x = e.clientX - dragOffset.x
    const y = e.clientY - dragOffset.y

    // Keep within viewport bounds
    const maxX = window.innerWidth - (legendRef.current?.offsetWidth || 0)
    const maxY = window.innerHeight - (legendRef.current?.offsetHeight || 0)

    setPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // Generate legend items
  const items = scaleType === 'steps' ? generateSteppedItems() : generateContinuousItems()

  // Reverse if needed
  const displayItems = config.reverseOrder ? [...items].reverse() : items

  // Position classes mapping
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

  // For continuous scale, create gradient string
  const gradientString = colors.length > 0
    ? `linear-gradient(${config.orientation === 'horizontal' ? 'to right' : 'to bottom'}, ${colors.join(', ')})`
    : 'transparent'

  return (
    <div
      ref={legendRef}
      onMouseDown={handleMouseDown}
      className={`
        fixed z-[1000]
        rounded-lg
        p-3
        ${position ? '' : (positionClasses[config.position] || positionClasses['above'])}
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        select-none
      `}
      style={{
        width: config.orientation === 'horizontal' ? `${config.size}px` : 'auto',
        maxWidth: config.orientation === 'vertical' ? '200px' : undefined,
        ...(position ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'none',
        } : {}),
      }}
    >
      {config.title?.show && (
        <div className="legend-title mb-2">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={config.title.text || ''}
              onChange={(e) => onTitleChange?.(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              placeholder="Lejant ismi giriniz"
              className="text-base font-bold text-zinc-900 bg-white/80 backdrop-blur-sm px-2 py-1 rounded border-2 border-blue-500 outline-none min-w-[150px] text-center"
            />
          ) : (
            <div
              onClick={handleTitleClick}
              className={`text-base font-bold text-zinc-900 drop-shadow-sm ${onTitleChange ? 'cursor-text hover:text-blue-600 transition-colors' : ''}`}
            >
              {config.title.text || 'Lejant ismi giriniz'}
            </div>
          )}
        </div>
      )}

      {scaleType === 'continuous' ? (
        // Continuous legend - gradient bar with labels
        config.orientation === 'horizontal' ? (
          // Horizontal layout: gradient on top, labels below
          <div className="space-y-2">
            <div
              className="h-4 w-full rounded border border-zinc-300"
              style={{ background: gradientString }}
            />
            <div className="flex flex-row justify-between">
              {displayItems.map((item, index) => (
                <span key={index} className="text-[10px] text-zinc-900 font-bold drop-shadow-sm">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          // Vertical layout: gradient on left, labels on right
          <div className="flex flex-row items-center gap-2">
            <div
              className="w-5 h-40 rounded border border-zinc-300"
              style={{ background: gradientString }}
            />
            <div className="flex flex-col justify-between h-40">
              {[...displayItems].reverse().map((item, index) => (
                <span key={index} className="text-[10px] text-zinc-900 font-bold drop-shadow-sm">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )
      ) : (
        // Stepped legend - discrete color boxes
        <div
          className={`legend-items ${
            config.orientation === 'horizontal'
              ? 'flex flex-row gap-1 flex-wrap'
              : 'flex flex-col space-y-1'
          }`}
        >
          {displayItems.map((item, index) => (
            <div
              key={index}
              className={`
                legend-item flex items-center gap-2 transition-all
                ${hoveredIndex === index ? 'opacity-100 scale-105' : 'opacity-90'}
                ${config.highlightOnHover ? 'cursor-pointer hover:bg-zinc-50 rounded px-1 -mx-1' : ''}
              `}
              onMouseEnter={() => handleItemHover(index)}
              onMouseLeave={() => handleItemHover(null)}
            >
              {/* Color swatch */}
              <div
                className="legend-color w-4 h-4 rounded-sm border border-zinc-300 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />

              {/* Label */}
              <span className="legend-label text-[10px] text-zinc-900 font-bold drop-shadow-sm whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  function generateSteppedItems() {
    const items: Array<{ color: string; label: string }> = []

    if (config.labels.type === 'custom' && config.labels.customLabels) {
      // Custom labels - one per color
      for (let i = 0; i < colors.length; i++) {
        items.push({
          color: colors[i],
          label: config.labels.customLabels[i] || '',
        })
      }
    } else if (config.labels.type === 'ruler') {
      // Ruler mode - show break values (one per color)
      for (let i = 0; i < colors.length; i++) {
        const breakValue = breaks[i]
        if (breakValue !== undefined) {
          items.push({
            color: colors[i],
            label: formatNumber(breakValue, config.format as NumberFormat),
          })
        }
      }
    } else {
      // Ranges mode - show ranges (one per color)
      for (let i = 0; i < colors.length; i++) {
        const lower = breaks[i]
        const upper = breaks[i + 1]

        let label = ''
        if (lower !== undefined && upper !== undefined) {
          const lowerFormatted = formatNumber(lower, config.format as NumberFormat)
          const upperFormatted = formatNumber(upper, config.format as NumberFormat)
          label = `${lowerFormatted} - ${upperFormatted}`
        }

        items.push({
          color: colors[i],
          label,
        })
      }
    }

    return items
  }

  function generateContinuousItems() {
    // For continuous scales, show gradient with key values
    const items: Array<{ color: string; label: string }> = []

    if (breaks.length < 2) {
      return items
    }

    const min = breaks[0]
    const max = breaks[breaks.length - 1]

    // Generate 5 evenly spaced labels for better readability
    const numLabels = 5
    for (let i = 0; i < numLabels; i++) {
      const ratio = i / (numLabels - 1)
      const value = min + (max - min) * ratio
      const colorIndex = Math.floor(ratio * (colors.length - 1))

      items.push({
        color: colors[colorIndex] || colors[0],
        label: formatNumber(value, config.format as NumberFormat),
      })
    }

    return items
  }
}
