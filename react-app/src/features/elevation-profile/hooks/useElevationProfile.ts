import { useCallback, useRef } from 'react'

import { fetchStraightElevation } from '../services/elevationProfileApi'
import { useElevationProfileStore } from '../stores/useElevationProfileStore'

export function useElevationProfile() {
  const store = useElevationProfileStore()
  const abortRef = useRef<AbortController | null>(null)

  const finalize = useCallback(async (waypoints: [number, number][]) => {
    if (waypoints.length < 2) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    store.setLoading(true)
    store.setError(null)

    try {
      const { points, stats } = await fetchStraightElevation(waypoints, controller.signal)
      store.setResult(points, stats)
      store.setPanelOpen(true)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      store.setError(err instanceof Error ? err.message : 'Yükseklik verisi alınamadı.')
    } finally {
      store.setLoading(false)
    }
  }, [store])

  const deactivate = useCallback(() => {
    abortRef.current?.abort()
    store.deactivate()
  }, [store])

  return {
    ...store,
    finalize,
    deactivate,
  }
}
