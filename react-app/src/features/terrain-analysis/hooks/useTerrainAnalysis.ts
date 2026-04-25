import { useCallback, useEffect, useRef } from 'react'

import { useMapStore } from '@/stores/useMapStore'
import { useToolStore } from '@/stores/useToolStore'

import { TerrainAnalysisRenderer } from '../services/TerrainAnalysisRenderer'
import { useTerrainAnalysisStore } from '../stores/useTerrainAnalysisStore'

export function useTerrainAnalysis() {
  const map = useMapStore((s) => s.mapInstance)
  const activeTool = useToolStore((s) => s.activeTool)
  const setActiveTool = useToolStore((s) => s.setActiveTool)
  const {
    isActive,
    isPanelOpen,
    isLoading,
    error,
    selectedPoint,
    result,
    activate,
    deactivate,
    toggle,
    setPanelOpen,
    reset,
  } = useTerrainAnalysisStore()
  const rendererRef = useRef<TerrainAnalysisRenderer | null>(null)

  const getRenderer = useCallback(() => {
    if (!map) return null
    if (!rendererRef.current) rendererRef.current = new TerrainAnalysisRenderer(map)
    return rendererRef.current
  }, [map])

  const deactivateAnalysis = useCallback(() => {
    deactivate()
    if (activeTool === 'aspect-analysis') setActiveTool('none')
  }, [activeTool, deactivate, setActiveTool])

  useEffect(() => {
    const renderer = getRenderer()
    if (!renderer) return

    if (isActive && result) {
      renderer.render(result)
    } else {
      renderer.remove()
    }
  }, [isActive, result, getRenderer])

  useEffect(() => {
    return () => {
      rendererRef.current?.remove()
      rendererRef.current = null
    }
  }, [map])

  return {
    isActive,
    isPanelOpen,
    isLoading,
    error,
    selectedPoint,
    result,
    activate,
    deactivate: deactivateAnalysis,
    toggle,
    setPanelOpen,
    reset,
  }
}
