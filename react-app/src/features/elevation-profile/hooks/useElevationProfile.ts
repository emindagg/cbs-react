import { useCallback, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { fetchStraightElevation } from '../services/elevationProfileApi'
import { useElevationProfileStore } from '../stores/useElevationProfileStore'

export function useElevationProfile() {
  // activePoint kasıtlı olarak dışarıda bırakıldı:
  // hot-path state'tir, değiştiğinde tüketici bileşenlerin yeniden render edilmesi gerekmiyor.
  // ElevationProfileTool haritayı doğrudan Zustand aboneliği ile günceller.
  const s = useElevationProfileStore(
    useShallow((state) => ({
      waypoints: state.waypoints,
      isPanelOpen: state.isPanelOpen,
      isLoading: state.isLoading,
      error: state.error,
      elevationData: state.elevationData,
      stats: state.stats,
      addWaypoint: state.addWaypoint,
      setActivePoint: state.setActivePoint,
      setPanelOpen: state.setPanelOpen,
      setLoading: state.setLoading,
      setError: state.setError,
      setResult: state.setResult,
      reset: state.reset,
    })),
  )

  const abortRef = useRef<AbortController | null>(null)

  const finalize = useCallback(async (waypoints: [number, number][]) => {
    if (waypoints.length < 2) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    s.setLoading(true)
    s.setError(null)

    try {
      const { points, stats } = await fetchStraightElevation(waypoints, controller.signal)
      s.setResult(points, stats)
      s.setPanelOpen(true)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      s.setError(err instanceof Error ? err.message : 'Yükseklik verisi alınamadı.')
    } finally {
      s.setLoading(false)
    }
  }, [s])

  const deactivate = useCallback(() => {
    abortRef.current?.abort()
    s.reset()
  }, [s])

  return {
    waypoints: s.waypoints,
    isPanelOpen: s.isPanelOpen,
    isLoading: s.isLoading,
    error: s.error,
    elevationData: s.elevationData,
    stats: s.stats,
    addWaypoint: s.addWaypoint,
    setActivePoint: s.setActivePoint,
    setPanelOpen: s.setPanelOpen,
    reset: s.reset,
    finalize,
    deactivate,
  }
}
