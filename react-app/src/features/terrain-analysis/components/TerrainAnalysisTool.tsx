import type maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

import { clampTerrainZoom, DEFAULT_TERRAIN_ZOOM } from '../services/terrainMath'
import { analyzeAspectFromTerrarium } from '../services/terrainTiles'
import { useTerrainAnalysisStore } from '../stores/useTerrainAnalysisStore'
import type { TerrainAnalysisPoint } from '../types'

function getAnalysisZoom(map: maplibregl.Map): number {
  return clampTerrainZoom(map.getZoom?.() ?? DEFAULT_TERRAIN_ZOOM)
}

export default function TerrainAnalysisTool() {
  const { current: mapObj } = useMap()
  const activeTool = useToolStore((state) => state.activeTool)
  const setActiveTool = useToolStore((state) => state.setActiveTool)
  const isActive = activeTool === 'aspect-analysis'
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const map = mapObj?.getMap() as maplibregl.Map | null ?? null
    if (!map) return

    if (!isActive) {
      abortRef.current?.abort()
      abortRef.current = null
      map.getCanvas().style.cursor = ''
      return
    }

    const runAnalysis = async (point: TerrainAnalysisPoint) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const store = useTerrainAnalysisStore.getState()
      store.setSelectedPoint(point)
      store.setPanelOpen(true)
      store.setLoading(true)
      store.setError(null)

      try {
        const result = await analyzeAspectFromTerrarium(point, {
          zoom: getAnalysisZoom(map),
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        store.setResult(result)
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Bakı analizi yapılamadı'
        store.setError(message)
        store.setResult(null)
      } finally {
        if (!controller.signal.aborted) {
          store.setLoading(false)
        }
      }
    }

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      void runAnalysis({ lng: event.lngLat.lng, lat: event.lngLat.lat })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      abortRef.current?.abort()
      useTerrainAnalysisStore.getState().deactivate()
      setActiveTool('none')
    }

    map.getCanvas().style.cursor = 'crosshair'
    map.on('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      abortRef.current?.abort()
      abortRef.current = null
      map.off('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      map.getCanvas().style.cursor = ''
    }
  }, [mapObj, isActive, setActiveTool])

  return null
}
