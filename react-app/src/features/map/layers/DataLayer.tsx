import type { FeatureCollection, Feature } from 'geojson'
import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'

import { useClusteringStore } from '@/stores/useClusteringStore'
import { type StyleProperties, isStyleProperties } from '@/types/style'

import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'
import type { DataItem } from '../../data-management'

// Pure function - renk/boyut style'ları hariç, sadece geometri + kimlik + etiket
// Renk/opaklık güncellemeleri useLayerStyleSync hook'u tarafından setPaintProperty ile yapılır
// labelField değişince rebuild tetiklenir (intentional - nadir bir aksiyon)
function buildFeature(i: DataItem, activeItemId: string | null, labelField: string): Feature {
  const rawStyle = i.properties.style
  const style: StyleProperties = isStyleProperties(rawStyle) ? rawStyle : {}
  const customFillColor = (i.source === 'drawn' && style.fillColor) ? style.fillColor : null
  const labelValue = labelField ? i.properties[labelField] : undefined

  return {
    type: 'Feature',
    id: i.id,
    geometry: i.geometry,
    properties: {
      id: i.id,
      name: i.name,
      selected: i.id === activeItemId,
      customFillColor,
      labelText: labelValue != null ? String(labelValue) : '',
    },
  } as unknown as Feature
}

export default function DataLayer() {
  const items = useDataManagementStore(state => state.items)
  const activeItemId = useDataManagementStore(state => state.activeItemId)
  // Sadece labelField subscribe et - diğer stiller useLayerStyleSync tarafından yönetiliyor
  const labelField = useDataManagementStore(state => state.layerStyles.labelField)
  const { isEnabled: isClusteringEnabled } = useClusteringStore()

  const visibleItems = useMemo(() => items.filter(i => i.visible), [items])

  const pointData = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: visibleItems
      .filter(i => i.geometry.type === 'Point' || i.geometry.type === 'MultiPoint')
      .map(i => buildFeature(i, activeItemId, labelField)),
  }), [visibleItems, activeItemId, labelField])

  const lineData = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: visibleItems
      .filter(i => i.geometry.type === 'LineString' || i.geometry.type === 'MultiLineString')
      .map(i => buildFeature(i, activeItemId, labelField)),
  }), [visibleItems, activeItemId, labelField])

  const polygonData = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: visibleItems
      .filter(i => i.geometry.type === 'Polygon' || i.geometry.type === 'MultiPolygon')
      .map(i => buildFeature(i, activeItemId, labelField)),
  }), [visibleItems, activeItemId, labelField])

  return (
    <>
      {/* POLYGONS */}
      <Source id="data-polygons" type="geojson" data={polygonData}>
        <Layer
          id="data-layer-polygon-fill"
          type="fill"
          paint={{
            'fill-color': ['case', ['boolean', ['get', 'selected'], false], '#f59e0b', '#3b82f6'],
            'fill-opacity': 0.27,
          }}
        />
        <Layer
          id="data-layer-polygon-outline"
          type="line"
          paint={{
            'line-color': ['case', ['boolean', ['get', 'selected'], false], '#d97706', '#000000'],
            'line-width': ['case', ['boolean', ['get', 'selected'], false], 2, 0.5],
            'line-opacity': 0.9,
          }}
        />
        <Layer
          id="data-layer-polygon-labels"
          type="symbol"
          layout={{
            'text-field': ['coalesce', ['get', 'labelText'], ''],
            'text-size': 12,
          }}
          paint={{
            'text-color': '#111827',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
          }}
        />
      </Source>

      {/* LINES */}
      <Source id="data-lines" type="geojson" data={lineData}>
        <Layer
          id="data-layer-line"
          type="line"
          layout={{ 'line-join': 'round', 'line-cap': 'round' }}
          paint={{
            'line-color': ['case', ['boolean', ['get', 'selected'], false], '#f59e0b', '#3b82f6'],
            'line-width': ['case', ['boolean', ['get', 'selected'], false], 4, 3],
            'line-opacity': 0.9,
          }}
        />
        <Layer
          id="data-layer-line-labels"
          type="symbol"
          layout={{
            'text-field': ['coalesce', ['get', 'labelText'], ''],
            'text-size': 12,
            'symbol-placement': 'line-center',
          }}
          paint={{
            'text-color': '#111827',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
          }}
        />
      </Source>

      {/* POINTS */}
      {!isClusteringEnabled && (
        <Source id="data-points" type="geojson" data={pointData}>
          <Layer
            id="data-layer-point"
            type="circle"
            paint={{
              'circle-radius': 3,
              'circle-color': ['case', ['boolean', ['get', 'selected'], false], '#f59e0b', '#3b82f6'],
              'circle-stroke-width': 0.5,
              'circle-stroke-color': '#000000',
              'circle-opacity': 0.9,
            }}
          />
          <Layer
            id="data-layer-point-labels"
            type="symbol"
            layout={{
              'text-field': ['coalesce', ['get', 'labelText'], ''],
              'text-size': 12,
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
            }}
            paint={{
              'text-color': '#111827',
              'text-halo-color': '#ffffff',
              'text-halo-width': 1,
            }}
          />
        </Source>
      )}
    </>
  )
}
