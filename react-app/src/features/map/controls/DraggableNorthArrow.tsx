import { useCallback, useEffect, useRef, useState } from 'react'

import { useMapStore } from '@/stores/useMapStore'

export default function DraggableNorthArrow() {
  const { mapInstance, northArrowVisible } = useMapStore()
  const [bearing, setBearing] = useState(0)
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 60,
    y: window.innerHeight - 160,
  }))
  const isDragging = useRef(false)
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  useEffect(() => {
    if (!mapInstance) return
    const update = () => setBearing(mapInstance.getBearing())
    update()
    mapInstance.on('rotate', update)
    return () => { mapInstance.off('rotate', update) }
  }, [mapInstance])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = true
      dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
      e.currentTarget.setPointerCapture(e.pointerId)
      e.stopPropagation()
    },
    [pos],
  )

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragOrigin.current.mx
    const dy = e.clientY - dragOrigin.current.my
    setPos({ x: dragOrigin.current.px + dx, y: dragOrigin.current.py + dy })
  }, [])

  const onPointerUp = useCallback(() => { isDragging.current = false }, [])

  if (!northArrowVisible || !mapInstance) return null

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 1300,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        width: 44,
        height: 44,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: '50%',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="-14 -14 28 28"
        style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 0.1s ease' }}
      >
        {/* North half - dark */}
        <path d="M 0,-11 L 4.5,0 L 0,-1.5 L -4.5,0 Z" fill="#1a1a1a" />
        {/* South half - light */}
        <path d="M 0,11 L 4.5,0 L 0,1.5 L -4.5,0 Z" fill="#bbb" />
        {/* Center dot */}
        <circle r="1.8" fill="#1a1a1a" />
        {/* N label */}
        <text
          x="0"
          y="-13"
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize="5.5"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          fill="#1a1a1a"
          letterSpacing="0.02em"
        >
          N
        </text>
      </svg>
    </div>
  )
}
