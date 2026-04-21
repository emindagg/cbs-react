import type maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useMapStore } from '@/stores/useMapStore'

 
const SCALE_STEPS_M = [
   
  1, 2, 5, 10, 20, 50, 100, 200, 500,
  // eslint-disable-next-line no-magic-numbers
  1000, 2000, 5000, 10000, 20000, 50000,
  // eslint-disable-next-line no-magic-numbers
  100000, 200000, 500000, 1000000,
]
const MAX_BAR_WIDTH = 100

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6_371_008.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function computeScale(map: maplibregl.Map) {
  const container = map.getContainer()
  const cx = container.clientWidth / 2
  const cy = container.clientHeight / 2

  const center = map.unproject([cx, cy])
  const right = map.unproject([cx + MAX_BAR_WIDTH / 2, cy])

  if (
    !Number.isFinite(center.lat) || !Number.isFinite(center.lng) ||
    !Number.isFinite(right.lat) || !Number.isFinite(right.lng)
  ) {
    return null
  }

  const halfMeters = haversineDistance(center.lat, center.lng, right.lat, right.lng)
  const maxMeters = halfMeters * 2

  if (!Number.isFinite(maxMeters) || maxMeters <= 0) return null

  let step = SCALE_STEPS_M[0]
  for (const s of SCALE_STEPS_M) {
    if (s <= maxMeters) step = s
    else break
  }

  const width = Math.round((step / maxMeters) * MAX_BAR_WIDTH)
  const label = step >= 1000 ? `${step / 1000} km` : `${step} m`
  return { width, label }
}

export default function DraggableScaleControl() {
  const { mapInstance } = useMapStore()
  const [scale, setScale] = useState<{ width: number; label: string } | null>(null)
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 150,
    y: window.innerHeight - 60,
  }))
  const isDragging = useRef(false)
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  useEffect(() => {
    if (!mapInstance) return
    const update = () => setScale(computeScale(mapInstance))
    update()
    mapInstance.on('move', update)
    mapInstance.on('zoom', update)
    return () => {
      mapInstance.off('move', update)
      mapInstance.off('zoom', update)
    }
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

  const onPointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  if (!scale || !mapInstance) return null

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
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
        color: '#333',
        fontSize: '11px',
      }}
    >
      {/* Label */}
      <span style={{ lineHeight: '14px', whiteSpace: 'nowrap', paddingLeft: 2, fontWeight: 'bold' }}>
        {scale.label}
      </span>
      {/* Bar */}
      <div
        style={{
          width: scale.width,
          height: 6,
          backgroundColor: '#fff',
          border: '2px solid #333',
          borderTop: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
