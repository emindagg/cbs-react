/**
 * Visualization Render Hook
 * Handles choropleth rendering logic
 *
 * vizKey split: dataVizKey triggers full re-render,
 * paintVizKey triggers paint-only update (opacity/color/size) via setPaintProperty.
 */

import type maplibregl from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import {
  DEFAULT_DOT_COLOR,
  DEFAULT_DOT_OPACITY,
  DEFAULT_DOT_SIZE,
  buildZoomRadius,
  VisualizationManager,
} from '@/shared/visualization'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { BUBBLE_DEFAULT_FILL_COLOR } from '@/features/visualization/bubble/constants'
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
  const dotOpacity = settings.dotOpacity ?? DEFAULT_DOT_OPACITY
  map.setPaintProperty('dot-circles', 'circle-radius', buildZoomRadius(dotSize) as PaintPropertyValue<number>)
  map.setPaintProperty('dot-circles', 'circle-color', dotColor)
  map.setPaintProperty('dot-circles', 'circle-opacity', dotOpacity as PaintPropertyValue<number>)
}

/** Update choropleth paint properties without full re-render */
function updateChoroplethPaintProperties(map: maplibregl.Map, settings: VisualizationSettings) {
  if (!map.getLayer('choropleth-fill')) return
  const choroplethOpacity = settings.choroplethOpacity ?? 1
  map.setPaintProperty('choropleth-fill', 'fill-opacity', choroplethOpacity as PaintPropertyValue<number>)
}

/** Update bubble paint-only properties (stroke, opacity) without full re-render */
function updateBubblePaintProperties(map: maplibregl.Map, settings: VisualizationSettings) {
  if (!map.getLayer('bubble-circles')) return
  const opacity = settings.symbolOpacity ?? 1
  const strokeColor = settings.symbolStrokeColor || '#ffffff'
  const strokeWidth = settings.symbolStrokeWidth ?? 0.5
  const fillColor = settings.symbolFillColor || BUBBLE_DEFAULT_FILL_COLOR

  map.setPaintProperty('bubble-circles', 'circle-color', fillColor as PaintPropertyValue<string>)
  map.setPaintProperty('bubble-circles', 'circle-opacity', opacity as PaintPropertyValue<number>)
  map.setPaintProperty('bubble-circles', 'circle-stroke-color', strokeColor)
  map.setPaintProperty('bubble-circles', 'circle-stroke-width', strokeWidth as PaintPropertyValue<number>)
}

export function useVizRender({
  matchResults,
  columnMapping,
  vizSettings,
  map,
}: UseVizRenderProps) {
  const [isRendering, setIsRendering] = useState(false)
  const [hasRendered, setHasRendered] = useState(false)
  const { setCurrentVisualization, setVisualizationRenderInProgress, colorConfig } = useVisualizationStore()

  // Data-affecting settings → full re-render
  // NOTE: vizSettings.type is intentionally excluded so that changing the
  // visualization type alone does NOT trigger an automatic re-render.
  // The user must click the "Yeniden Görselleştir" button for the type change to take effect.
  const range = colorConfig.customRange
  const DEFAULT_BACKDROP_FILL_OPACITY = 1
  const dataVizKey = [
    vizSettings.classificationMethod,
    vizSettings.classCount,
    vizSettings.colorScheme,
    vizSettings.legendType || 'steps',
    vizSettings.interpolation || 'equidistant',
    vizSettings.dotValue ?? 'auto',
    vizSettings.backdropFillOpacity ?? DEFAULT_BACKDROP_FILL_OPACITY,
    range?.enabled ? 'range:on' : 'range:off',
    range?.min ?? 'range:auto-min',
    range?.max ?? 'range:auto-max',
    range?.outOfRangeMode ?? 'range:gray',
    // Bubble: renk ve boyut hesabını etkileyen ayarlar
    vizSettings.symbolFillColor ?? 'none',
    vizSettings.colorColumn ?? 'none',
    vizSettings.bubbleSizeMode ?? 'proportional',
    vizSettings.symbolScaling ?? 'sqrt',
    vizSettings.symbolMinSize ?? 'auto',
    vizSettings.symbolMaxSize ?? 'auto',
  ].join('-')
  // Paint-only settings → setPaintProperty (no data recomputation)
  const paintVizKey = [
    vizSettings.type,
    vizSettings.dotSize ?? 'auto',
    vizSettings.dotColor ?? 'auto',
    vizSettings.dotOpacity ?? 'auto',
    vizSettings.choroplethOpacity ?? 'auto',
    // Bubble paint-only: kontur ve opaklık
    vizSettings.symbolStrokeColor ?? 'auto',
    vizSettings.symbolOpacity ?? 'auto',
    vizSettings.symbolStrokeWidth ?? 'auto',
  ].join('-')

  // Display-only settings → updateDisplayOptions (no data recomputation, no full re-render)
  const displayVizKey = [
    vizSettings.showLabels ?? false,
    vizSettings.showValues ?? false,
    vizSettings.dataOnlyMode ?? false,
    vizSettings.noDataColor ?? '#e4e4e4',
  ].join('-')

  const prevDataVizKeyRef = useRef<string | null>(null)
  const prevPaintVizKeyRef = useRef<string | null>(null)
  const prevDisplayVizKeyRef = useRef<string | null>(null)

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
      prevDisplayVizKeyRef.current = displayVizKey // sync display key on full render
      void handleRender()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVizKey, hasRendered, map])

  // Paint-only update when visual-only settings change (no full re-render)
  useEffect(() => {
    if (!hasRendered || !map) return
    if (prevPaintVizKeyRef.current === null) {
      prevPaintVizKeyRef.current = paintVizKey
      return
    }
    if (prevPaintVizKeyRef.current !== paintVizKey) {
      prevPaintVizKeyRef.current = paintVizKey
      const { vizSettings: s } = useVisualizationStore.getState()
      if (s.type === 'dot') {
        updateDotPaintProperties(map, s)
      } else if (s.type === 'choropleth') {
        updateChoroplethPaintProperties(map, s)
      } else if (s.type === 'bubble') {
        updateBubblePaintProperties(map, s)
      }
    }
  }, [paintVizKey, hasRendered, map])

  // Display-only update: showLabels / showValues / dataOnlyMode toggles (instant, no re-render)
  useEffect(() => {
    if (!hasRendered || !map) return
    if (prevDisplayVizKeyRef.current === null) {
      prevDisplayVizKeyRef.current = displayVizKey
      return
    }
    if (prevDisplayVizKeyRef.current !== displayVizKey) {
      prevDisplayVizKeyRef.current = displayVizKey
      const { vizSettings: s } = useVisualizationStore.getState()
      const vizManager = new VisualizationManager(map)
      vizManager.updateDisplayOptions(s)
    }
  }, [displayVizKey, hasRendered, map])

  const handleRender = async () => {
    if (!map) {
      toast.error('Harita bulunamadı!')
      return
    }

    setIsRendering(true)
    setVisualizationRenderInProgress(true)

    try {
      const vizManager = new VisualizationManager(map)

      // Closure yerine anlık store değerlerini oku — stale closure sorununu önler
      const { vizSettings: currentVizSettings, colorConfig: currentColorConfig } =
        useVisualizationStore.getState()

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

      if (!columnMapping.dataColumn) {
        toast.error('Veri kolonu seçilmedi!')
        return
      }

      // Determine location level
      const locationLevel = columnMapping.locationLevel === 'province' ? 'province' : 'district'

      // Clear previous visualization layers before rendering new type
      vizManager.clearVisualization()

      // Route based on visualization type
      const renderSettings: VisualizationSettings = {
        ...currentVizSettings,
        customRange: currentColorConfig.customRange,
      }

      switch (currentVizSettings.type) {
        case 'choropleth':
          await vizManager.renderChoropleth(successfulData, columnMapping.dataColumn, renderSettings, locationLevel)
          break

        case 'dot':
          await vizManager.renderPoint(successfulData, columnMapping.dataColumn, renderSettings, locationLevel)
          break

        case 'bubble':
          await vizManager.renderBubble(successfulData, columnMapping.dataColumn, renderSettings, locationLevel)
          break

        default:
          // Fallback to choropleth
          await vizManager.renderChoropleth(successfulData, columnMapping.dataColumn, renderSettings, locationLevel)
      }

      // Update current visualization to trigger legend display
      setCurrentVisualization({
        type: currentVizSettings.type,
        data: successfulData,
        column: columnMapping.dataColumn,
        locationLevel,
        renderSettings,
      })

      setHasRendered(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error('Görselleştirme hatası: ' + message)
    } finally {
      setVisualizationRenderInProgress(false)
      setIsRendering(false)
    }
  }

  return {
    isRendering,
    hasRendered,
    handleRender,
  }
}
