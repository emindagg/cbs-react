/**
 * Map Title Component
 * Editable title that appears on the map
 */

import { useState, useRef, useEffect } from 'react'

interface MapTitleProps {
  title: string;
  subtitle?: string;
  visible: boolean;
  position: 'top-left' | 'top-center' | 'top-right';
  onTitleChange: (title: string) => void;
  onSubtitleChange?: (subtitle: string) => void;
}

export default function MapTitle({
  title,
  subtitle,
  visible,
  position,
  onTitleChange,
}: MapTitleProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const titleRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!visible) return null

  // Position classes
  const positionClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
  }

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingTitle])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditingTitle) return
    if (!titleRef.current) return

    const rect = titleRef.current.getBoundingClientRect()
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

    const maxX = window.innerWidth - (titleRef.current?.offsetWidth || 0)
    const maxY = window.innerHeight - (titleRef.current?.offsetHeight || 0)

    setCustomPosition({
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

  const handleTitleClick = () => {
    setIsEditingTitle(true)
  }

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false)
    }
  }

  return (
    <div
      ref={titleRef}
      onMouseDown={handleMouseDown}
      className={`
        fixed z-[999]
        ${customPosition ? '' : (positionClasses[position] || positionClasses['top-center'])}
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        select-none
      `}
      style={{
        ...(customPosition ? {
          left: `${customPosition.x}px`,
          top: `${customPosition.y}px`,
          transform: 'none',
        } : {}),
      }}
    >
      <div className="text-center">
        {/* Title */}
        {isEditingTitle ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            placeholder="Harita başlığını giriniz"
            className="text-2xl font-bold text-zinc-900 bg-white/80 backdrop-blur-sm px-3 py-1 rounded border-2 border-blue-500 outline-none min-w-[300px] text-center"
          />
        ) : (
          <h1
            onClick={handleTitleClick}
            className="text-2xl font-bold text-zinc-900 drop-shadow-md hover:text-blue-600 transition-colors cursor-text px-3 py-1"
          >
            {title || 'Harita başlığını giriniz'}
          </h1>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-zinc-700 drop-shadow-sm mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
