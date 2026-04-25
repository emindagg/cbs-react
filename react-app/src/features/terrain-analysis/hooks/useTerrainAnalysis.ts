import { useCallback, useEffect, useRef } from 'react'

import { useMapStore } from '@/stores/useMapStore'
import { useToolStore } from '@/stores/useToolStore'

import { analyzePolygonSlopeFromTerrarium } from '../services/polygonSlopeAnalysis'
import { TerrainAnalysisRenderer } from '../services/TerrainAnalysisRenderer'
import { useTerrainAnalysisStore } from '../stores/useTerrainAnalysisStore'
import type { TerrainPolygonOption } from '../types'

export function useTerrainAnalysis() {
  const map = useMapStore((s) => s.mapInstance)
  const activeTool = useToolStore((s) => s.activeTool)
  const setActiveTool = useToolStore((s) => s.setActiveTool)
  const {
    isActive,
    isPanelOpen,
    isLoading,
    error,
    mode,
    selectedPoint,
    result,
    selectedPolygonId,
    slopeResult,
    slopeOpacity,
    activate,
    deactivate,
    toggle,
    setMode,
    setPanelOpen,
    setSelectedPolygonId,
    setSlopeResult,
    setSlopeOpacity,
    reset,
  } = useTerrainAnalysisStore()
  const rendererRef = useRef<TerrainAnalysisRenderer | null>(null)
  const slopeAbortRef = useRef<AbortController | null>(null)

  const getRenderer = useCallback(() => {
    if (!map) return null
    if (!rendererRef.current) rendererRef.current = new TerrainAnalysisRenderer(map)
    return rendererRef.current
  }, [map])

  const deactivateAnalysis = useCallback(() => {
    slopeAbortRef.current?.abort()
    deactivate()
    if (activeTool === 'aspect-analysis') setActiveTool('none')
  }, [activeTool, deactivate, setActiveTool])

  const runSlopeAnalysis = useCallback(async (polygon: TerrainPolygonOption) => {
    slopeAbortRef.current?.abort()
    const controller = new AbortController()
    slopeAbortRef.current = controller
    const store = useTerrainAnalysisStore.getState()
    store.setMode('polygon-slope')
    store.setSelectedPolygonId(polygon.id)
    store.setPanelOpen(true)
    store.setLoading(true)
    store.setError(null)
    store.setSlopeResult(null)

    try {
      const slope = await analyzePolygonSlopeFromTerrarium({
        itemId: polygon.id,
        itemName: polygon.name,
        geometry: polygon.geometry,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      store.setSlopeResult(slope)
    } catch (error) {
      if (controller.signal.aborted) return
      store.setError(error instanceof Error ? error.message : 'Eğim analizi yapılamadı.')
    } finally {
      if (!controller.signal.aborted) store.setLoading(false)
    }
  }, [map])

  useEffect(() => {
    const renderer = getRenderer()
    if (!renderer) return

    if (isActive && mode === 'point-aspect' && result) {
      renderer.render(result)
      renderer.removeSlope()
    } else if (isActive && mode === 'polygon-slope' && slopeResult) {
      renderer.removeAspect()
      renderer.renderSlope(slopeResult, slopeOpacity)
    } else {
      renderer.remove()
    }
  }, [isActive, mode, result, slopeResult, slopeOpacity, getRenderer])

  useEffect(() => {
    rendererRef.current?.setSlopeOpacity(slopeOpacity)
  }, [slopeOpacity])

  useEffect(() => {
    return () => {
      rendererRef.current?.remove()
      rendererRef.current = null
      slopeAbortRef.current?.abort()
      slopeAbortRef.current = null
    }
  }, [map])

  return {
    isActive,
    isPanelOpen,
    isLoading,
    error,
    mode,
    selectedPoint,
    result,
    selectedPolygonId,
    slopeResult,
    slopeOpacity,
    activate,
    deactivate: deactivateAnalysis,
    toggle,
    setMode,
    setPanelOpen,
    setSelectedPolygonId,
    setSlopeResult,
    setSlopeOpacity,
    runSlopeAnalysis,
    reset,
  }
}
