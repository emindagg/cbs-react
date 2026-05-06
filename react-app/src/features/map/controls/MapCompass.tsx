import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { useMapStore } from '@/stores/useMapStore'
import { useToolStore } from '@/stores/useToolStore'

const DIRECTIONS = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB']
const DIRECTION_COUNT = DIRECTIONS.length
const SECTOR_DEGREES = 360 / DIRECTION_COUNT
const SECTOR_HALF = SECTOR_DEGREES / 2
const DRAG_SENSITIVITY = 0.35
const PITCH_DRAG_SENSITIVITY = 0.35
const MIN_PITCH = 0
const MAX_PITCH = 88

function getDirectionText(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360
  const index = Math.floor((normalized + SECTOR_HALF) / SECTOR_DEGREES) % DIRECTION_COUNT
  return DIRECTIONS[index]
}

export function MapCompass() {
  const { mapInstance } = useMapStore()
  const isGisOpen = useToolStore((s) => s.toolsMenuMode !== 'closed')
  const [bearing, setBearing] = useState(0)
  const [compassText, setCompassText] = useState('K')
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartYRef = useRef(0)
  const dragStartBearingRef = useRef(0)
  const dragStartPitchRef = useRef(0)

  useEffect(() => {
    if (!mapInstance) return

    const onRotate = () => {
      const current = mapInstance.getBearing()
      setBearing(current)
      setCompassText(getDirectionText(current))
    }

    mapInstance.on('rotate', onRotate)
    mapInstance.once('idle', onRotate)

    return () => {
      mapInstance.off('rotate', onRotate)
    }
  }, [mapInstance])

  const handleClick = useCallback(() => {
    if (!mapInstance || hasDraggedRef.current) {
      hasDraggedRef.current = false
      return
    }
    mapInstance.easeTo({ bearing: 0, pitch: 0, duration: 600 })
  }, [mapInstance])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!mapInstance) return
    event.preventDefault()
    isDraggingRef.current = true
    hasDraggedRef.current = false
    dragStartXRef.current = event.clientX
    dragStartYRef.current = event.clientY
    dragStartBearingRef.current = mapInstance.getBearing()
    dragStartPitchRef.current = mapInstance.getPitch()
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [mapInstance])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!mapInstance || !isDraggingRef.current) return
    const deltaX = event.clientX - dragStartXRef.current
    const deltaY = event.clientY - dragStartYRef.current
    const nextBearing = dragStartBearingRef.current + (deltaX * DRAG_SENSITIVITY)
    const nextPitch = Math.min(
      MAX_PITCH,
      Math.max(MIN_PITCH, dragStartPitchRef.current - (deltaY * PITCH_DRAG_SENSITIVITY)),
    )
    hasDraggedRef.current = Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1
    mapInstance.setBearing(nextBearing)
    mapInstance.setPitch(nextPitch)
  }, [mapInstance])

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  if (!mapInstance) return null

  return (
    <div
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title="Kuzeye Sıfırla"
      data-export-ignore="true"
      style={{
        position: 'fixed',
        top: 60,
        right: 10,
        width: 37,
        height: 37,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        // eslint-disable-next-line no-magic-numbers
        zIndex: isGisOpen ? 0 : 1200,
        userSelect: 'none',
        touchAction: 'none',
        background: 'rgba(28,28,30,0.85)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.15)',
      }}
    >
      {/* Dönen kadran */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          transform: `rotate(${-bearing}deg)`,
          transition: 'transform 0.05s linear',
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {/* Kuzey üçgeni (kırmızı) */}
          <polygon
            points="50,6 56,16 44,16"
            fill="#FF3B30"
            stroke="#FF3B30"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Ana yön tikleri (D, G, B) */}
          <rect x="48.5" y="8" width="3" height="7" fill="#E5E5EA" rx="1.5" transform="rotate(90 50 50)" />
          <rect x="48.5" y="8" width="3" height="7" fill="#E5E5EA" rx="1.5" transform="rotate(180 50 50)" />
          <rect x="48.5" y="8" width="3" height="7" fill="#E5E5EA" rx="1.5" transform="rotate(270 50 50)" />
          {/* Ara yön tikleri */}
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(22.5 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(45 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(67.5 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(112.5 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(135 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(157.5 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(202.5 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(225 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(247.5 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(292.5 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(315 50 50)" />
          <rect x="49" y="9" width="2" height="5" fill="#636366" rx="1" transform="rotate(337.5 50 50)" />
        </svg>
      </div>

      {/* Sabit yön harfi — dönen kadranın üzerinde, pozisyon bağımsız */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: '0.5px',
          color: '#E5E5EA',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
          lineHeight: 1,
        }}
      >
        {compassText}
      </div>
    </div>
  )
}
