import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useClusteringStore } from '@/stores/useClusteringStore'
import { useMapStore } from '@/stores/useMapStore'
import { useTimelineStore } from '@/features/timeline'

import type { DataItem } from '../../data-management/types'
import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'

function isPointType(item: DataItem): boolean {
  return item.type === 'point' || (!!item.geometry && (item.geometry.type === 'Point' || item.geometry.type === 'MultiPoint'))
}

export function useClustering() {
  const map = useMapStore((state) => state.mapInstance)

  const timelineActive = useTimelineStore(s => s.isActive)
  const timeEnd = useTimelineStore(s => s.currentEnd)
  const getEffectiveStart = useTimelineStore(s => s.getEffectiveStart)
  const numericFilter = useTimelineStore(s => s.numericFilter)

  const allPointItems = useDataManagementStore(
    useShallow((state) =>
      state.items.filter(item => item.visible && isPointType(item)),
    ),
  )

  const pointItems = useMemo(() => {
    if (!timelineActive) return allPointItems

    const effectiveStart = getEffectiveStart()

    return allPointItems.filter(item => {
      if (item.date) {
        const ts = new Date(item.date).getTime()
        if (!Number.isNaN(ts)) {
          if (ts < effectiveStart || ts > timeEnd) return false
        }
      }

      if (numericFilter) {
        const val = Number(item.properties[numericFilter.field])
        if (!Number.isNaN(val)) {
          if (val < numericFilter.currentMin || val > numericFilter.currentMax) return false
        }
      }

      return true
    })
  }, [allPointItems, timelineActive, timeEnd, getEffectiveStart, numericFilter])

  const { isEnabled } = useClusteringStore()

  const featureCollection = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: pointItems.map(item => ({
      type: 'Feature' as const,
      geometry: item.geometry,
      properties: { ...item.properties, id: item.id },
    })),
  }), [pointItems])

  // Setup/teardown source + layers when isEnabled toggles
  useEffect(() => {
    if (!map || !isEnabled) return

    const sourceId = 'clustered-points-source'
    const clusterLayerId = 'clusters-layer'
    const countLayerId = 'cluster-count-layer'
    const unclusteredLayerId = 'unclustered-point-layer'

    const onClusterClick = (e: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] })
      if (!features.length) return
      const clusterId = features[0].properties.cluster_id
      const source = map.getSource(sourceId) as GeoJSONSource
      if (source && source.getClusterExpansionZoom) {
        source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          const coords = features[0].geometry as { type: string; coordinates: [number, number] }
          map.easeTo({ center: coords.coordinates, zoom })
        }).catch(() => {})
      }
    }

    const cleanup = () => {
      if (map.getLayer(clusterLayerId)) { map.off('click', clusterLayerId, onClusterClick); map.removeLayer(clusterLayerId) }
      if (map.getLayer(countLayerId)) map.removeLayer(countLayerId)
      if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }

    cleanup()

    map.addSource(sourceId, {
      type: 'geojson',
      data: featureCollection,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    })

    map.addLayer({
      id: clusterLayerId, type: 'circle', source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
      },
    })

    map.addLayer({
      id: countLayerId, type: 'symbol', source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: { 'text-color': '#ffffff' },
    })

    map.addLayer({
      id: unclusteredLayerId, type: 'circle', source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-color': '#4264fb', 'circle-radius': 6, 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
    })

    map.on('click', clusterLayerId, onClusterClick)

    return cleanup
  }, [map, isEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (!map || !isEnabled) return
    const source = map.getSource('clustered-points-source') as GeoJSONSource | undefined
    if (source) source.setData(featureCollection)
  }, [map, isEnabled, featureCollection])
}
