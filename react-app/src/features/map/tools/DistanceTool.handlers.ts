/**
 * Distance Tool Event Handlers
 * Separated for better organization
 */

import type maplibregl from 'maplibre-gl'
import { useCallback, useRef } from 'react'

import { useToolStore } from '@/stores/useToolStore'

interface UseDistanceHandlersProps {
  isActive: boolean
  isDrawingDistance: boolean
  distancePoints: [number, number][]
  isClosed: boolean
  onGhostReset: () => void
}

export function useDistanceHandlers({
  isActive,
  isDrawingDistance,
  distancePoints,
  isClosed,
  onGhostReset,
}: UseDistanceHandlersProps) {
  const {
    setDistancePoints,
    setIsDrawingDistance,
    resetDistance,
  } = useToolStore()

  const dragPendingRef = useRef<Map<number, [number, number]> | null>(null)
  const dragRafRef = useRef<number | null>(null)

  const handleClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isActive) return

    const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]

    if (!isDrawingDistance) {
      resetDistance()
      setIsDrawingDistance(true)
      setDistancePoints([newPoint])
    } else {
      setDistancePoints([...distancePoints, newPoint])
    }
  }, [isActive, isDrawingDistance, distancePoints, setDistancePoints, setIsDrawingDistance, resetDistance])

  const handleDblClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isActive || !isDrawingDistance) return
    e.preventDefault()

    setIsDrawingDistance(false)
    onGhostReset()
  }, [isActive, isDrawingDistance, setIsDrawingDistance, onGhostReset])

  const handleFirstPointClick = useCallback((e: { originalEvent?: Event } | Event) => {
    const hasOriginalEvent = (evt: unknown): evt is { originalEvent: Event; stopPropagation?: never } =>
      typeof evt === 'object' && evt !== null && 'originalEvent' in evt

    if (hasOriginalEvent(e) && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
      e.originalEvent.stopPropagation()
    } else if (e && typeof (e as Event).stopPropagation === 'function') {
      (e as Event).stopPropagation()
    }

    if (isActive && isDrawingDistance && distancePoints.length >= 3) {
      const firstPoint = distancePoints[0]
      setDistancePoints([...distancePoints, firstPoint])
      setIsDrawingDistance(false)
      onGhostReset()
    }
  }, [isActive, isDrawingDistance, distancePoints, setDistancePoints, setIsDrawingDistance, onGhostReset])

  const handleMarkerDrag = useCallback((idx: number, e: { lngLat: { lng: number; lat: number } }) => {
    const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]

    if (!dragPendingRef.current) {
      dragPendingRef.current = new Map()
    }
    dragPendingRef.current.set(idx, newPoint)

    if (dragRafRef.current === null) {
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null
        if (!dragPendingRef.current || dragPendingRef.current.size === 0) return

        const newPoints: [number, number][] = [...distancePoints]
        dragPendingRef.current.forEach((point, markerIdx) => {
          newPoints[markerIdx] = point

          if (isClosed) {
            if (markerIdx === 0) {
              newPoints[newPoints.length - 1] = point
            } else if (markerIdx === newPoints.length - 1) {
              newPoints[0] = point
            }
          }
        })
        dragPendingRef.current.clear()
        setDistancePoints(newPoints)
      })
    }
  }, [distancePoints, isClosed, setDistancePoints])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive) return
    if (e.key === 'Escape') {
      if (isDrawingDistance || distancePoints.length > 0) {
        resetDistance()
      } else {
        // Use setTimeout to avoid calling setState synchronously within effect
        setTimeout(() => {
          useToolStore.setState({ activeTool: 'none' })
        }, 0)
      }
    }
  }, [isActive, isDrawingDistance, distancePoints.length, resetDistance])

  return {
    handleClick,
    handleDblClick,
    handleFirstPointClick,
    handleMarkerDrag,
    handleKeyDown,
  }
}
