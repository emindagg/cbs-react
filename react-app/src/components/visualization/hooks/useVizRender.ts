/**
 * Visualization Render Hook
 * Handles choropleth rendering logic
 */

import type maplibregl from 'maplibre-gl'
import { useState } from 'react'

import { VisualizationManager } from '../../../services/VisualizationManager'
import type { MatchResults, VisualizationSettings } from '../../../types/visualization'

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

  const handleRender = async () => {
    if (!map) {
      // eslint-disable-next-line no-alert
      alert('Harita bulunamadı!')
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
        // eslint-disable-next-line no-alert
        alert('Görselleştirilecek veri yok!')
        return
      }

      // Render choropleth
      await vizManager.renderChoropleth(
        successfulData,
        columnMapping.dataColumn!,
        vizSettings,
        columnMapping.locationLevel === 'province' ? 'province' : 'district',
      )

      setHasRendered(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      // eslint-disable-next-line no-alert
      alert('Görselleştirme hatası: ' + message)
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
