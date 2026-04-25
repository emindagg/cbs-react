import { useCallback, useEffect, useRef, useState } from 'react'

export interface DraggablePosition {
  x: number
  y: number
}

interface UseDraggableOptions {
  /** Başlangıç pozisyonu hesaplayıcı (window boyutlarına göre) */
  initial: () => DraggablePosition
  /** Sürüklenebilir öğenin genişliği (kenar sınırlama için) */
  width: number
  /** Sürüklenebilir öğenin yüksekliği (kenar sınırlama için) */
  height: number
  /** Kenar boşluğu (px), varsayılan 8 */
  edgePadding?: number
  /** Window resize olduğunda pozisyonu yeniden hesaplasın mı? */
  recomputeOnResize?: boolean
}

interface UseDraggableReturn {
  position: DraggablePosition
  setPosition: (pos: DraggablePosition) => void
  isDragging: boolean
  handlers: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void
  }
}

const DEFAULT_EDGE_PADDING = 8

/**
 * Genel amaçlı sürüklenebilir konum yönetimi.
 * Pointer events üzerinden çalışır, viewport sınırlarına clamp eder.
 *
 * Kullanım:
 *   const { position, handlers } = useDraggable({
 *     initial: () => ({ x: 100, y: 100 }),
 *     width: 240,
 *     height: 320,
 *   })
 *   <div style={{ position: 'fixed', left: position.x, top: position.y }} {...handlers} />
 */
export function useDraggable({
  initial,
  width,
  height,
  edgePadding = DEFAULT_EDGE_PADDING,
  recomputeOnResize = true,
}: UseDraggableOptions): UseDraggableReturn {
  const [position, setPosition] = useState<DraggablePosition>(initial)
  const [isDragging, setIsDragging] = useState(false)
  const draggingRef = useRef(false)
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const clamp = useCallback((pos: DraggablePosition): DraggablePosition => ({
    x: Math.max(edgePadding, Math.min(pos.x, window.innerWidth - width - edgePadding)),
    y: Math.max(edgePadding, Math.min(pos.y, window.innerHeight - height - edgePadding)),
  }), [width, height, edgePadding])

  useEffect(() => {
    if (!recomputeOnResize) return
    const handleResize = () => setPosition((prev) => clamp(prev))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [clamp, recomputeOnResize])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    draggingRef.current = true
    setIsDragging(true)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: position.x, py: position.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
  }, [position])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return
    const dx = e.clientX - dragOrigin.current.mx
    const dy = e.clientY - dragOrigin.current.my
    setPosition(clamp({
      x: dragOrigin.current.px + dx,
      y: dragOrigin.current.py + dy,
    }))
  }, [clamp])

  const onPointerUp = useCallback(() => {
    draggingRef.current = false
    setIsDragging(false)
  }, [])

  return {
    position,
    setPosition,
    isDragging,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  }
}
