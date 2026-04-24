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

// Rehydrate/ensureLayer sonrasında viz katmanlarının basemap-layer altında kalmasını
// engellemek için stack'in en üstüne taşımakta kullanılır.
const VIZ_LAYER_IDS: string[] = [
  'choropleth-fill',
  'choropleth-outline',
  'bubble-circles',
  'dot-circles',
  'viz-name-labels',
  'viz-value-labels',
]

function hasVisualizationLayer(map: maplibregl.Map, type: VizType): boolean {
  return Boolean(map.getLayer(LAYER_BY_VIZ_TYPE[type]))
}

function moveVisualizationLayersToTop(map: maplibregl.Map): void {
  for (const layerId of VIZ_LAYER_IDS) {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId)
    }
  }
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
      // Viz layer zaten varsa bile basemap-layer sonradan eklenmiş olabilir; üste taşı.
      // isStyleLoaded() beklemeden güvenli şekilde çağrılabilir - moveLayer sadece
      // mevcut layer'ları etkiler.
      moveVisualizationLayersToTop(map)

      if (!map.isStyleLoaded()) return
      if (useVisualizationStore.getState().isVisualizationRenderInProgress) return
      if (isRehydratingRef.current) return

      isRehydratingRef.current = true

      void rehydrateVisualization(map)
        .then(() => {
          moveVisualizationLayersToTop(map)
        })
        .finally(() => {
          isRehydratingRef.current = false
        })
    }

    map.on('styledata', onStyleData)
    return () => {
      map.off('styledata', onStyleData)
    }
  }, [map])
}
