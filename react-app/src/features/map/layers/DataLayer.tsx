import type { FeatureCollection, Feature } from 'geojson'
import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'

import { useClusteringStore } from '@/stores/useClusteringStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { type StyleProperties, isStyleProperties } from '@/types/style'

import type { DataItem } from '../../data-management'
import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'

// Pure function - renk/boyut style'ları hariç, sadece geometri + kimlik + etiket
// Renk/opaklık güncellemeleri useLayerStyleSync hook'u tarafından setPaintProperty ile yapılır
// labelField değişince rebuild tetiklenir (intentional - nadir bir aksiyon)
function buildFeature(i: DataItem, activeItemId: string | null, labelField: string): Feature {
  const rawStyle = i.properties.style
  const style: StyleProperties = isStyleProperties(rawStyle) ? rawStyle : {}
  const customFillColor = style.fillColor ? style.fillColor : null
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
      labelText: labelValue !== null && labelValue !== undefined ? String(labelValue) : '',
    },
  } as unknown as Feature
}

const POINT_LABEL_TEXT_OFFSET_Y = 1.2

// Seçili değilse: önce customFillColor (buffer/analiz rengi), yoksa layerStyles fallback
const fillColorExpression = (defaultFill: string) => [
  'case',
  ['boolean', ['get', 'selected'], false],
  '#f59e0b',
  ['case', ['!=', ['get', 'customFillColor'], null], ['get', 'customFillColor'], defaultFill],
]

export default function DataLayer() {
  const items = useDataManagementStore(state => state.items)
  const activeItemId = useDataManagementStore(state => state.activeItemId)
  const labelField = useDataManagementStore(state => state.layerStyles.labelField)
  const defaultFillColor = useDataManagementStore(state => state.layerStyles.fillColor)
  const layerOpacity = useDataManagementStore(state => state.layerStyles.opacity)
  const layerWidth = useDataManagementStore(state => state.layerStyles.width)
  const lineWidth = useDataManagementStore(state => state.layerStyles.lineWidth)
  const strokeWidth = useDataManagementStore(state => state.layerStyles.strokeWidth)
  const strokeColor = useDataManagementStore(state => state.layerStyles.strokeColor)
  const { isEnabled: isClusteringEnabled, mode: clusterMode } = useClusteringStore()

  const timelineActive = useTimelineStore(s => s.isActive)
  const timeEnd = useTimelineStore(s => s.currentEnd)
  const getEffectiveStart = useTimelineStore(s => s.getEffectiveStart)
  const numericFilter = useTimelineStore(s => s.numericFilter)

  const visibleItems = useMemo(() => {
    if (!timelineActive) return items.filter(i => i.visible)

    const effectiveStart = getEffectiveStart()

    return items.filter(i => {
      if (!i.visible) return false

      if (i.date) {
        const ts = new Date(i.date).getTime()
        if (!Number.isNaN(ts)) {
          if (ts < effectiveStart || ts > timeEnd) return false
        }
      }

      if (numericFilter) {
        const val = Number(i.properties[numericFilter.field])
        if (!Number.isNaN(val)) {
          if (val < numericFilter.currentMin || val > numericFilter.currentMax) return false
        }
      }

      return true
    })
  }, [items, timelineActive, timeEnd, getEffectiveStart, numericFilter])

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
            'fill-color': fillColorExpression(defaultFillColor) as unknown as string,
            'fill-opacity': layerOpacity * 0.3,
          }}
        />
        <Layer
          id="data-layer-polygon-outline"
          type="line"
          paint={{
            'line-color': ['case', ['boolean', ['get', 'selected'], false], '#d97706', strokeColor] as unknown as string,
            'line-width': ['case', ['boolean', ['get', 'selected'], false], 2, strokeWidth] as unknown as number,
            'line-opacity': layerOpacity,
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
            'text-halo-width': 0,
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
            'line-color': ['case', ['boolean', ['get', 'selected'], false], '#f59e0b', strokeColor] as unknown as string,
            'line-width': ['case', ['boolean', ['get', 'selected'], false], lineWidth + 1, lineWidth] as unknown as number,
            'line-opacity': layerOpacity,
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
            'text-halo-width': 0,
          }}
        />
      </Source>

      {/* POINTS */}
      {!isClusteringEnabled && clusterMode !== 'hidden' && (
        <Source id="data-points" type="geojson" data={pointData}>
          <Layer
            id="data-layer-point"
            type="circle"
            paint={{
              'circle-radius': layerWidth,
              'circle-color': fillColorExpression(defaultFillColor) as unknown as string,
              'circle-stroke-width': strokeWidth,
              'circle-stroke-color': ['case', ['boolean', ['get', 'selected'], false], '#d97706', strokeColor] as unknown as string,
              'circle-opacity': layerOpacity,
            }}
          />
          <Layer
            id="data-layer-point-labels"
            type="symbol"
            layout={{
              'text-field': ['coalesce', ['get', 'labelText'], ''],
              'text-size': 12,
              'text-offset': [0, POINT_LABEL_TEXT_OFFSET_Y],
              'text-anchor': 'top',
            }}
            paint={{
              'text-color': '#111827',
              'text-halo-width': 0,
            }}
          />
        </Source>
      )}
    </>
  )
}
