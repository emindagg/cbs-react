import { useCallback, useRef, useState } from 'react'

import { LAND_COVER_LEGEND_ITEMS } from '../hooks/useOverlayLayers'

interface LandCoverLegendProps {
  isVisible: boolean
}

export function LandCoverLegend({ isVisible }: LandCoverLegendProps) {
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 232,
    y: window.innerHeight - 170,
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
    const newX = dragOrigin.current.px + dx
    const newY = dragOrigin.current.py + dy

    const LEGEND_W = 219
    const LEGEND_H = 130
    const clampedX = Math.max(8, Math.min(newX, window.innerWidth - LEGEND_W - 8))
    const clampedY = Math.max(8, Math.min(newY, window.innerHeight - LEGEND_H - 8))

    setPos({ x: clampedX, y: clampedY })
  }, [])

  const onPointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  if (!isVisible) return null

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed z-1200 w-[219px] max-w-[78vw] rounded-lg border border-white/20 bg-black/45 px-2 py-1.5 shadow-lg backdrop-blur-[1px]"
      style={{
        left: pos.x,
        top: pos.y,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <h3 className="mb-1 text-[13px] font-semibold text-white">Arazi Örtüsü (2018)</h3>
      <div className="space-y-1">
        {LAND_COVER_LEGEND_ITEMS.map((item) => (
          <div
            key={item.code}
            className="flex items-stretch overflow-hidden rounded-[3px] text-[12px] leading-none font-semibold text-white"
          >
            <span className="w-[18px] shrink-0 rounded-[2px] border border-white/20" style={{ backgroundColor: item.color }} />
            <span className="flex-1 truncate px-1.5 py-1">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
