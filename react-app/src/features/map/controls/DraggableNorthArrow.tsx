import { useCallback, useEffect, useRef, useState } from 'react'

import { useMapStore } from '@/stores/useMapStore'

export default function DraggableNorthArrow() {
  const { mapInstance, northArrowVisible } = useMapStore()
  const [bearing, setBearing] = useState(0)
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 80,
    y: window.innerHeight - 200,
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
        width: 72,
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* SVG döner, etiketler sabit kalır */}
      <svg
        width="72"
        height="72"
        viewBox="-36 -36 72 72"
        style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 0.1s ease' }}
      >
        {/* --- 4 yön okları --- */}

        {/* Kuzey (K) - kırmızı */}
        <path d="M 0,-26 L 6,0 L 0,-5 L -6,0 Z" fill="#c0392b" />
        {/* Güney (G) */}
        <path d="M 0,26 L 6,0 L 0,5 L -6,0 Z" fill="#1a1a1a" />
        {/* Doğu (D) */}
        <path d="M 26,0 L 0,6 L 5,0 L 0,-6 Z" fill="#1a1a1a" />
        {/* Batı (B) */}
        <path d="M -26,0 L 0,6 L -5,0 L 0,-6 Z" fill="#1a1a1a" />

        {/* Merkez çember */}
        <circle r="7" fill="white" stroke="#1a1a1a" strokeWidth="1.5" />
        <circle r="2.5" fill="#1a1a1a" />

        {/* Yön etiketleri */}
        <text x="0" y="-29" textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif"
          fill="#c0392b">K</text>
        <text x="0" y="36" textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif"
          fill="#1a1a1a">G</text>
        <text x="31" y="2.5" textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif"
          fill="#1a1a1a">D</text>
        <text x="-31" y="2.5" textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif"
          fill="#1a1a1a">B</text>
      </svg>
    </div>
  )
}
