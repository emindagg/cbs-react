import type { MapMouseEvent } from 'maplibre-gl'
import { useCallback, useEffect, useState } from 'react'

import type { DataItem } from '@/stores/useDataManagementStore'
import { useDataManagementStore } from '@/stores/useDataManagementStore'
import { useMapStore } from '@/stores/useMapStore'

const QUERY_LAYERS = [
  'data-layer-point',
  'data-layer-line',
  'data-layer-polygon-fill',
]

export interface FeaturePopupState {
  lngLat: [number, number]
  candidates: DataItem[]
  selected: DataItem | null
}

export function useFeaturePopup() {
  const map = useMapStore(s => s.mapInstance)
  const items = useDataManagementStore(s => s.items)
  const drawMode = useDataManagementStore(s => s.drawMode)
  const [popup, setPopup] = useState<FeaturePopupState | null>(null)

  const close = useCallback(() => setPopup(null), [])

  const selectItem = useCallback((item: DataItem | null) => {
    setPopup(prev => prev ? { ...prev, selected: item } : null)
  }, [])

  useEffect(() => {
    if (!map) return

    const handleClick = (e: MapMouseEvent) => {
      if (drawMode !== 'none') return

      const existingLayers = QUERY_LAYERS.filter(id => map.getLayer(id))
      if (!existingLayers.length) return

      const features = map.queryRenderedFeatures(e.point, { layers: existingLayers })
      if (!features.length) {
        setPopup(null)
        return
      }

      const ids = [...new Set(
        features.map(f => f.properties?.id as string).filter(Boolean),
      )]

      const dataItems = ids
        .map(id => items.find(item => item.id === id))
        .filter((item): item is DataItem => !!item)

      if (!dataItems.length) {
        setPopup(null)
        return
      }

      setPopup({
        lngLat: [e.lngLat.lng, e.lngLat.lat],
        candidates: dataItems,
        selected: dataItems.length === 1 ? dataItems[0] : null,
      })
    }

    const handleMouseMove = (e: MapMouseEvent) => {
      if (drawMode !== 'none') return
      const existingLayers = QUERY_LAYERS.filter(id => map.getLayer(id))
      if (!existingLayers.length) return

      const features = map.queryRenderedFeatures(e.point, { layers: existingLayers })
      const hasDataItem = features.some(f => {
        const id = f.properties?.id as string
        return id && items.some(item => item.id === id)
      })
      map.getCanvas().style.cursor = hasDataItem ? 'pointer' : ''
    }

    map.on('click', handleClick)
    map.on('mousemove', handleMouseMove)

    return () => {
      map.off('click', handleClick)
      map.off('mousemove', handleMouseMove)
      map.getCanvas().style.cursor = ''
    }
  }, [map, items, drawMode])

  return { popup, close, selectItem }
}
