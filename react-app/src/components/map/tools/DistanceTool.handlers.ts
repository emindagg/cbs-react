/**
 * Distance Tool Event Handlers
 * Separated for better organization
 */

import type maplibregl from 'maplibre-gl'
import { useCallback } from 'react'

import { useToolStore } from '@/stores/useToolStore'

interface UseDistanceHandlersProps {
  isActive: boolean
  isDrawingDistance: boolean
  distancePoints: [number, number][]
  isClosed: boolean
}

export function useDistanceHandlers({
  isActive,
  isDrawingDistance,
  distancePoints,
  isClosed,
}: UseDistanceHandlersProps) {
  const {
    setDistancePoints,
    setDistanceGhostPoint,
    setIsDrawingDistance,
    resetDistance,
  } = useToolStore()

  const handleMouseMove = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isActive || !isDrawingDistance) return
    setDistanceGhostPoint([e.lngLat.lng, e.lngLat.lat])
  }, [isActive, isDrawingDistance, setDistanceGhostPoint])

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
    setDistanceGhostPoint(null)
  }, [isActive, isDrawingDistance, setIsDrawingDistance, setDistanceGhostPoint])

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
      setDistanceGhostPoint(null)
    }
  }, [isActive, isDrawingDistance, distancePoints, setDistancePoints, setIsDrawingDistance, setDistanceGhostPoint])

  const handleMarkerDrag = useCallback((idx: number, e: { lngLat: { lng: number; lat: number } }) => {
    const newPoints: [number, number][] = [...distancePoints]
    const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]

    newPoints[idx] = newPoint

    if (isClosed) {
      if (idx === 0) {
        newPoints[newPoints.length - 1] = newPoint
      } else if (idx === newPoints.length - 1) {
        newPoints[0] = newPoint
      }
    }

    setDistancePoints(newPoints)
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
    handleMouseMove,
    handleClick,
    handleDblClick,
    handleFirstPointClick,
    handleMarkerDrag,
    handleKeyDown,
  }
}
