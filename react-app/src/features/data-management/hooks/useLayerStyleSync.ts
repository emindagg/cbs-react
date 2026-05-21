import { useEffect } from 'react'

import { useMapStore } from '@/stores/useMapStore'

import { useDataManagementStore } from '../store/useDataManagementStore'

const SELECTION_COLOR = '#06b6d4'
const SELECTION_OUTLINE_COLOR = '#0891b2'
const SELECTION_LINE_WIDTH_DELTA = 3
const SELECTION_POINT_RADIUS_DELTA = 2

/**
 * layerStyles değişince MapLibre paint properties'i doğrudan günceller.
 * GeoJSON data rebuild'i tetiklemez - O(1) GPU-side işlem.
 * Bu sayede slider etkileşimleri INP'yi tetiklemez.
 */
export function useLayerStyleSync() {
  const map = useMapStore(state => state.mapInstance)
  const layerStyles = useDataManagementStore(state => state.layerStyles)

  useEffect(() => {
    if (!map) return

    const trySet = (layerId: string, prop: string, value: unknown) => {
      if (!map.getLayer(layerId)) return
      try {
        map.setPaintProperty(layerId, prop, value as Parameters<typeof map.setPaintProperty>[2])
      } catch {
        // Layer henüz hazır değil, sessizce geç
      }
    }

    const trySetLayout = (layerId: string, prop: string, value: unknown) => {
      if (!map.getLayer(layerId)) return
      try {
        map.setLayoutProperty(layerId, prop, value as Parameters<typeof map.setLayoutProperty>[2])
      } catch {
        // Layer henüz hazır değil, sessizce geç
      }
    }

    const selected = ['boolean', ['get', 'selected'], false]
    const customOrDefault = (fallback: string) =>
      ['case', ['!=', ['get', 'customFillColor'], null], ['get', 'customFillColor'], fallback]

    // Point layer
    trySet('data-layer-point', 'circle-radius',
      ['case', selected, layerStyles.width + SELECTION_POINT_RADIUS_DELTA, layerStyles.width])
    trySet('data-layer-point', 'circle-color',
      ['case', selected, SELECTION_COLOR, customOrDefault(layerStyles.fillColor)])
    trySet('data-layer-point', 'circle-stroke-width', layerStyles.strokeWidth)
    trySet('data-layer-point', 'circle-stroke-color',
      ['case', selected, SELECTION_OUTLINE_COLOR, layerStyles.strokeColor])
    trySet('data-layer-point', 'circle-opacity', layerStyles.opacity)
    trySet('data-layer-point', 'circle-stroke-opacity', layerStyles.strokeOpacity)

    // Polygon fill
    trySet('data-layer-polygon-fill', 'fill-color',
      ['case', selected, SELECTION_COLOR, customOrDefault(layerStyles.fillColor)])
    trySet('data-layer-polygon-fill', 'fill-opacity', layerStyles.opacity)

    // Polygon outline
    trySet('data-layer-polygon-outline', 'line-color',
      ['case', selected, SELECTION_OUTLINE_COLOR, layerStyles.strokeColor])
    trySet('data-layer-polygon-outline', 'line-width',
      ['case', selected, layerStyles.strokeWidth + SELECTION_LINE_WIDTH_DELTA, layerStyles.strokeWidth])
    trySet('data-layer-polygon-outline', 'line-opacity', layerStyles.strokeOpacity)

    // Line layer
    trySet('data-layer-line', 'line-color',
      ['case', selected, SELECTION_COLOR, customOrDefault(layerStyles.strokeColor)])
    trySet('data-layer-line', 'line-width',
      ['case', selected, layerStyles.lineWidth + SELECTION_LINE_WIDTH_DELTA, layerStyles.lineWidth])
    trySet('data-layer-line', 'line-opacity', layerStyles.strokeOpacity)

    // Label layers - textSize (layout) + textColor (paint)
    const labelLayerIds = ['data-layer-point-labels', 'data-layer-line-labels', 'data-layer-polygon-labels']
    for (const id of labelLayerIds) {
      trySetLayout(id, 'text-size', layerStyles.textSize)
      trySet(id, 'text-color', layerStyles.textColor)
    }

  }, [map, layerStyles])
}
