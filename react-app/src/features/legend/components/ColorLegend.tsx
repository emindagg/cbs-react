/**
 * Legend Component
 * Flexible legend with position, orientation, and format options
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import type { LegendConfiguration, ColorScaleType, ClassificationMethod } from '@/types/visualization'

import { BarContent } from './BarContent'

interface LegendProps {
  config: LegendConfiguration;
  breaks: number[];
  colors: string[];
  scaleType: ColorScaleType;
  classificationMethod?: ClassificationMethod;
  onHover?: (index: number | null) => void;
  onTitleChange?: (title: string) => void;
}

export default function ColorLegend({
  config,
  breaks,
  colors,
  scaleType,
  classificationMethod,
  onTitleChange,
}: LegendProps) {
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = e.clientX - dragOffset.x
    const y = e.clientY - dragOffset.y
    const maxX = window.innerWidth - (legendRef.current?.offsetWidth || 0)
    const maxY = window.innerHeight - (legendRef.current?.offsetHeight || 0)
    setPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    })
  }, [dragOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (!config.visible) return null

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
              className="font-bold text-[#333333] bg-white px-2 py-1 rounded border-2 border-blue-500 outline-none min-w-[150px] text-center"
              style={{ fontSize: `${config.title.fontSize ?? 16}px` }}
            />
          ) : (
            <div
              onClick={handleTitleClick}
              className={`font-bold text-[#333333] ${onTitleChange ? 'cursor-text hover:text-blue-600 transition-colors' : ''}`}
              style={{ fontSize: `${config.title.fontSize ?? 16}px` }}
            >
              {config.title.text || 'Lejant ismi giriniz'}
            </div>
          )}
        </div>
      )}

      <BarContent
        config={config}
        breaks={breaks}
        colors={colors}
        scaleType={scaleType}
        classificationMethod={classificationMethod}
      />
    </div>
  )
}
