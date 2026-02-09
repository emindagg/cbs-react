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

  // Title editing focus (hooks must be before any return)
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const x = e.clientX - dragOffset.x
    const y = e.clientY - dragOffset.y

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

  if (!config.visible) return null

  const handleItemHover = (index: number | null) => {
    if (config.highlightOnHover) {
      setHoveredIndex(index)
      onHover?.(index)
    }
  }

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

  // For continuous scale, create gradient string (reverse colors when reverseOrder)
  const gradientColors = config.reverseOrder ? [...colors].reverse() : colors
  const gradientString = gradientColors.length > 0
    ? `linear-gradient(${config.orientation === 'horizontal' ? 'to right' : 'to bottom'}, ${gradientColors.join(', ')})`
    : 'transparent'

  const verticalBarHeight = `${config.size}px`

  return (
    <div
      ref={legendRef}
      onMouseDown={handleMouseDown}
      className={`
        fixed z-[1000]
        ${position ? '' : (positionClasses[config.position] || positionClasses['above'])}
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        select-none
      `}
      style={{
        width: config.orientation === 'horizontal' ? `${config.size}px` : 'auto',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: 'transparent',
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
              className="text-[16px] font-bold text-[#333333] bg-white px-2 py-1 rounded border-2 border-blue-500 outline-none min-w-[150px] text-center"
            />
          ) : (
            <div
              onClick={handleTitleClick}
              className={`text-[16px] font-bold text-[#333333] ${onTitleChange ? 'cursor-text hover:text-blue-600 transition-colors' : ''}`}
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
              className="h-[14px] w-full rounded-none"
              style={{
                background: gradientString,
                boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
              }}
            />
            <div className="flex flex-row justify-between">
              {displayItems.map((item, index) => (
                <span key={index} className="text-[12px] text-[#333333] font-[450]">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          // Vertical layout: gradient on left, labels on right
          <div className="flex flex-row items-center gap-2">
            <div
              className="w-[14px] rounded-none"
              style={{
                background: gradientString,
                height: verticalBarHeight,
                boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
              }}
            />
            <div className="flex flex-col justify-between" style={{ height: verticalBarHeight }}>
              {displayItems.map((item, index) => (
                <span key={index} className="text-[12px] text-[#333333] font-[450]">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )
      ) : (
        // Stepped legend - discrete color boxes
        config.orientation === 'vertical' ? (
          // Datawrapper thermometer style: color column + labels on the right
          (() => {
            const isRuler = config.labels.type === 'ruler'
            // For ruler: N colors from palette, N+1 boundary labels
            // For ranges/custom: use displayItems (1 color + 1 label per item)
            const verticalColors = isRuler
              ? (config.reverseOrder ? [...colors].reverse() : colors)
              : displayItems.map((item) => item.color)
            const stepHeight = Math.max(16, Math.floor(config.size / verticalColors.length))
            const totalHeight = stepHeight * verticalColors.length

            // Ruler: boundary labels (N+1), Ranges/Custom: item labels (N)
            const rulerLabels = isRuler
              ? (config.reverseOrder ? [...breaks].reverse() : breaks)
                .map((b) => formatNumber(b, config.format as NumberFormat))
              : []

            return (
              <div className="flex flex-row" style={{ position: 'relative' }}>
                {/* Solid color column — zero gap */}
                <div
                  className="flex flex-col"
                  style={{ width: '18px', flexShrink: 0 }}
                >
                  {verticalColors.map((color, index) => (
                    <div
                      key={index}
                      className={config.highlightOnHover ? 'cursor-pointer' : ''}
                      style={{
                        backgroundColor: color,
                        height: `${stepHeight}px`,
                        width: '100%',
                        margin: 0,
                        padding: 0,
                        lineHeight: 0,
                        boxShadow: index < verticalColors.length - 1
                          ? 'inset 0 -1px 0 rgba(0,0,0,0.08)'
                          : 'none',
                      }}
                      onMouseEnter={() => handleItemHover(index)}
                      onMouseLeave={() => handleItemHover(null)}
                    />
                  ))}
                </div>

                {/* Labels */}
                <div
                  style={{
                    position: 'relative',
                    height: `${totalHeight}px`,
                    marginLeft: '6px',
                  }}
                >
                  {isRuler ? (
                    // Ruler: N+1 boundary labels at block edges
                    rulerLabels.map((label, index) => (
                      <span
                        key={index}
                        className="text-[12px] text-[#333333] font-[450] whitespace-nowrap leading-none"
                        style={{
                          position: 'absolute',
                          top: `${index * stepHeight}px`,
                          transform: 'translateY(-50%)',
                        }}
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    // Ranges/Custom: N labels centered on each block
                    displayItems.map((item, index) => (
                      <span
                        key={index}
                        className="text-[12px] text-[#333333] font-[450] whitespace-nowrap leading-none"
                        style={{
                          position: 'absolute',
                          top: `${index * stepHeight + stepHeight / 2}px`,
                          transform: 'translateY(-50%)',
                        }}
                      >
                        {item.label}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )
          })()
        ) : (
          // Horizontal layout
          <div className="legend-items flex flex-row gap-1 flex-wrap">
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
                  className="legend-color w-[12px] h-[12px] rounded-none flex-shrink-0"
                  style={{
                    backgroundColor: item.color,
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                />

                {/* Label */}
                <span className="legend-label text-[12px] text-[#333333] font-[450] whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )
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
      // Ruler mode - show ALL break values (boundaries)
      // For N colors, we have N+1 boundaries
      for (let i = 0; i < breaks.length; i++) {
        const breakValue = breaks[i]
        if (breakValue !== undefined) {
          items.push({
            color: colors[Math.min(i, colors.length - 1)], // Use last color for final break
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
    // For continuous scales, show only min and max (like Datawrapper)
    const items: Array<{ color: string; label: string }> = []

    if (breaks.length < 2) {
      return items
    }

    const min = breaks[0]
    const max = breaks[breaks.length - 1]

    items.push({
      color: colors[0],
      label: formatNumber(min, config.format as NumberFormat),
    })

    items.push({
      color: colors[colors.length - 1],
      label: formatNumber(max, config.format as NumberFormat),
    })

    return items
  }
}
