import type maplibregl from 'maplibre-gl'
import { useEffect, useState } from 'react'

import { useDraggable } from '@/hooks'
import { useMapStore } from '@/stores/useMapStore'

const SCALE_STEPS_M = [
  1, 2, 5, 10, 20, 50, 100, 200, 500,
  // eslint-disable-next-line no-magic-numbers
  1000, 2000, 5000, 10000, 20000, 50000,
  // eslint-disable-next-line no-magic-numbers
  100000, 200000, 500000, 1000000,
]
const MAX_BAR_WIDTH = 100
const CONTROL_WIDTH = 120
const CONTROL_HEIGHT = 50
const MOBILE_BREAKPOINT = 768
const MOBILE_BOTTOM_OFFSET = 70
const DESKTOP_BOTTOM_OFFSET = 60
const DESKTOP_RIGHT_OFFSET = 150
const EARTH_RADIUS_M = 6_371_008.8

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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
  // eslint-disable-next-line no-magic-numbers
  const label = step >= 1000 ? `${step / 1000} km` : `${step} m`
  return { width, label }
}

function getInitialPosition() {
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT
  return {
    x: isMobile ? Math.max(8, window.innerWidth / 2 - CONTROL_WIDTH / 2) : window.innerWidth - DESKTOP_RIGHT_OFFSET,
    y: isMobile ? window.innerHeight - MOBILE_BOTTOM_OFFSET : window.innerHeight - DESKTOP_BOTTOM_OFFSET,
  }
}

export default function DraggableScaleControl() {
  const { mapInstance } = useMapStore()
  const [scale, setScale] = useState<{ width: number; label: string } | null>(null)
  const { position, setPosition, handlers } = useDraggable({
    initial: getInitialPosition,
    width: CONTROL_WIDTH,
    height: CONTROL_HEIGHT,
    recomputeOnResize: false,
  })

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

  useEffect(() => {
    const handleResize = () => setPosition(getInitialPosition())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setPosition])

  if (!scale || !mapInstance) return null

  return (
    <div
      {...handlers}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
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
      <span style={{ lineHeight: '14px', whiteSpace: 'nowrap', paddingLeft: 2, fontWeight: 'bold' }}>
        {scale.label}
      </span>
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
