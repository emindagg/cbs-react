import type maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'

import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import type { VizType } from '@/types/visualization'

import { getVisualizationManager } from '../shared/VisualizationManager'

const LAYER_BY_VIZ_TYPE: Record<VizType, string> = {
  choropleth: 'choropleth-fill',
  bubble: 'bubble-circles',
  dot: 'dot-circles',
}

function hasVisualizationLayer(map: maplibregl.Map, type: VizType): boolean {
  return Boolean(map.getLayer(LAYER_BY_VIZ_TYPE[type]))
}

async function rehydrateVisualization(map: maplibregl.Map): Promise<void> {
  const { currentVisualization } = useVisualizationStore.getState()
  const { type, data, column, locationLevel, renderSettings } = currentVisualization

  if (!type || !data || !column || !locationLevel || !renderSettings) {
    return
  }

  if (hasVisualizationLayer(map, type)) {
    return
  }

  const vizManager = getVisualizationManager(map)

  switch (type) {
    case 'choropleth':
      await vizManager.renderChoropleth(data, column, renderSettings, locationLevel)
      break
    case 'dot':
      await vizManager.renderPoint(data, column, renderSettings, locationLevel)
      break
    case 'bubble':
      await vizManager.renderBubble(data, column, renderSettings, locationLevel)
      break
  }
}

export function useVisualizationLayerPersistence() {
  const map = useMapStore((state) => state.mapInstance)
  const isRehydratingRef = useRef(false)

  useEffect(() => {
    if (!map) return

    const onStyleData = () => {
      if (!map.isStyleLoaded()) return
      if (isRehydratingRef.current) return
      if (useVisualizationStore.getState().isVisualizationRenderInProgress) return

      isRehydratingRef.current = true

      void rehydrateVisualization(map).finally(() => {
        isRehydratingRef.current = false
      })
    }

    map.on('styledata', onStyleData)
    return () => {
      map.off('styledata', onStyleData)
    }
  }, [map])
}
