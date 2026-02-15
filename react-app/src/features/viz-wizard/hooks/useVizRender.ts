/**
 * Visualization Render Hook
 * Handles choropleth rendering logic
 *
 * vizKey split: dataVizKey triggers full re-render,
 * paintVizKey triggers paint-only update (dotSize/dotColor) via setPaintProperty.
 */

import type maplibregl from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { DEFAULT_DOT_COLOR, DEFAULT_DOT_SIZE, buildZoomRadius } from '@/features/viz-wizard'
import { VisualizationManager } from '@/services/VisualizationManager'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import type { PaintPropertyValue } from '@/types/maplibre-expressions'
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

/** Update dot paint properties without full re-render */
function updateDotPaintProperties(map: maplibregl.Map, settings: VisualizationSettings) {
  if (!map.getLayer('dot-circles')) return
  const dotSize = settings.dotSize ?? DEFAULT_DOT_SIZE
  const dotColor = settings.dotColor ?? DEFAULT_DOT_COLOR
  map.setPaintProperty('dot-circles', 'circle-radius', buildZoomRadius(dotSize) as PaintPropertyValue<number>)
  map.setPaintProperty('dot-circles', 'circle-color', dotColor)
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

  // Data-affecting settings → full re-render
  const dataVizKey = `${vizSettings.classificationMethod}-${vizSettings.classCount}-${vizSettings.colorScheme}-${vizSettings.type}-${vizSettings.legendType || 'steps'}-${vizSettings.interpolation || 'equidistant'}-${vizSettings.dotValue ?? 'auto'}`
  // Paint-only settings → setPaintProperty (no dot regeneration)
  const paintVizKey = `${vizSettings.dotSize ?? 'auto'}-${vizSettings.dotColor ?? 'auto'}`

  const prevDataVizKeyRef = useRef<string | null>(null)
  const prevPaintVizKeyRef = useRef<string | null>(null)

  // Full re-render when data-affecting settings change
  useEffect(() => {
    if (!hasRendered || !map) return
    if (prevDataVizKeyRef.current === null) {
      prevDataVizKeyRef.current = dataVizKey
      return
    }
    if (prevDataVizKeyRef.current !== dataVizKey) {
      prevDataVizKeyRef.current = dataVizKey
      prevPaintVizKeyRef.current = paintVizKey // sync paint key on full render
      void handleRender()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVizKey, hasRendered, map])

  // Paint-only update when dotSize/dotColor change (no full re-render)
  useEffect(() => {
    if (!hasRendered || !map || vizSettings.type !== 'dot') return
    if (prevPaintVizKeyRef.current === null) {
      prevPaintVizKeyRef.current = paintVizKey
      return
    }
    if (prevPaintVizKeyRef.current !== paintVizKey) {
      prevPaintVizKeyRef.current = paintVizKey
      updateDotPaintProperties(map, vizSettings)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paintVizKey, hasRendered, map])

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
