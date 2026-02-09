/**
 * Visualization Render Hook
 * Handles choropleth rendering logic
 */

import type maplibregl from 'maplibre-gl'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { VisualizationManager } from '@/services/VisualizationManager'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import type { MatchResults, VisualizationSettings } from '@/types/visualization'

interface UseVizRenderProps {
  matchResults: MatchResults
  columnMapping: {
    dataColumn: string | null
    locationLevel: 'province' | 'district' | 'mixed'
  }
  vizSettings: VisualizationSettings
  map: maplibregl.Map | null
}

export function useVizRender({
  matchResults,
  columnMapping,
  vizSettings,
  map,
}: UseVizRenderProps) {
  const [isRendering, setIsRendering] = useState(false)
  const [hasRendered, setHasRendered] = useState(false)
  const { setCurrentVisualization } = useVisualizationStore()

  const handleRender = async () => {
    if (!map) {
      toast.error('Harita bulunamadı!')
      return
    }

    setIsRendering(true)

    try {
      const vizManager = new VisualizationManager(map)

      // Get successful matches only
      const successfulData = matchResults.successful.map((m) => ({
        location: m.location,
        province: m.province,
        district: m.district,
        ...m.originalData,
      }))

      if (successfulData.length === 0) {
        toast.error('Görselleştirilecek veri yok!')
        return
      }

      // Determine location level
      const locationLevel = columnMapping.locationLevel === 'province' ? 'province' : 'district'

      // Route based on visualization type
      switch (vizSettings.type) {
        case 'choropleth':
          await vizManager.renderChoropleth(successfulData, columnMapping.dataColumn!, vizSettings, locationLevel)
          break

        case 'dot':
          await vizManager.renderPoint(successfulData, columnMapping.dataColumn!, vizSettings, locationLevel)
          break

        case 'bubble':
          await vizManager.renderBubble(successfulData, columnMapping.dataColumn!, vizSettings, locationLevel)
          break

        default:
          // Fallback to choropleth
          await vizManager.renderChoropleth(successfulData, columnMapping.dataColumn!, vizSettings, locationLevel)
      }

      // Update current visualization to trigger legend display
      setCurrentVisualization({
        type: vizSettings.type,
        data: successfulData,
        column: columnMapping.dataColumn,
      })

      setHasRendered(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error('Görselleştirme hatası: ' + message)
    } finally {
      setIsRendering(false)
    }
  }

  return {
    isRendering,
    hasRendered,
    handleRender,
  }
}
