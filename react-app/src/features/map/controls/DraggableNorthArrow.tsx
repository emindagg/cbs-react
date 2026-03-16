import { useCallback, useRef, useState } from 'react'

import { NORTH_ARROW_STYLES } from '@/shared/northArrowStyles'
import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

export default function DraggableNorthArrow() {
  const { mapInstance, northArrowVisible, northArrowStyle, northArrowBearing } = useMapStore()
  const { currentVisualization } = useVisualizationStore()
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 80,
    y: window.innerHeight - 200,
  }))
  const isDragging = useRef(false)
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 })

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

  if (!northArrowVisible || !mapInstance || currentVisualization.type === null) return null

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
      <svg
        width="72"
        height="72"
        viewBox="-30 -30 60 60"
        overflow="visible"
        style={{ transform: `rotate(${northArrowBearing}deg)`, transition: 'transform 0.1s ease' }}
      >
        {NORTH_ARROW_STYLES[northArrowStyle].render()}
      </svg>
    </div>
  )
}
