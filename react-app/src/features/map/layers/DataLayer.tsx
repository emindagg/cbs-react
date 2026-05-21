import type { FeatureCollection, Feature } from 'geojson'
import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'

import { useDataManagementStore } from '@/features/data-management'
import type { DataItem } from '@/features/data-management'
import { useClusteringStore } from '@/stores/useClusteringStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { type StyleProperties, isStyleProperties } from '@/types/style'

const SELECTION_COLOR = '#06b6d4'
const SELECTION_OUTLINE_COLOR = '#0891b2'
const SELECTION_LINE_WIDTH_DELTA = 3
const SELECTION_POINT_RADIUS_DELTA = 2

// Pure function - renk/boyut style'ları hariç, sadece geometri + kimlik + etiket
// Renk/opaklık güncellemeleri useLayerStyleSync hook'u tarafından setPaintProperty ile yapılır
// labelField değişince rebuild tetiklenir (intentional - nadir bir aksiyon)
function buildFeature(i: DataItem, highlightedIds: Set<string>, labelField: string): Feature {
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
      selected: highlightedIds.has(i.id),
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
  SELECTION_COLOR,
  ['case', ['!=', ['get', 'customFillColor'], null], ['get', 'customFillColor'], defaultFill],
]

export default function DataLayer() {
  const items = useDataManagementStore(state => state.items)
  const editingItemId = useDataManagementStore(state => state.editingItemId)
  const activeItemId = useDataManagementStore(state => state.activeItemId)
  const selectedItemIds = useDataManagementStore(state => state.selectedItemIds)
  const labelField = useDataManagementStore(state => state.layerStyles.labelField)
  const defaultFillColor = useDataManagementStore(state => state.layerStyles.fillColor)
  const layerOpacity = useDataManagementStore(state => state.layerStyles.opacity)
  const strokeOpacity = useDataManagementStore(state => state.layerStyles.strokeOpacity)
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
    if (!timelineActive) {
      return items.filter(i => i.visible && i.id !== editingItemId)
    }

    const effectiveStart = getEffectiveStart()

    return items.filter(i => {
      if (!i.visible || i.id === editingItemId) return false

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
  }, [items, timelineActive, timeEnd, getEffectiveStart, numericFilter, editingItemId])

  const highlightedIds = useMemo(() => {
    const ids = new Set(selectedItemIds)
    if (activeItemId) ids.add(activeItemId)
    return ids
  }, [activeItemId, selectedItemIds])

  const pointData = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: visibleItems
      .filter(i => i.geometry.type === 'Point' || i.geometry.type === 'MultiPoint')
      .map(i => buildFeature(i, highlightedIds, labelField)),
  }), [visibleItems, highlightedIds, labelField])

  const lineData = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: visibleItems
      .filter(i => i.geometry.type === 'LineString' || i.geometry.type === 'MultiLineString')
      .map(i => buildFeature(i, highlightedIds, labelField)),
  }), [visibleItems, highlightedIds, labelField])

  const polygonData = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: visibleItems
      .filter(i => i.geometry.type === 'Polygon' || i.geometry.type === 'MultiPolygon')
      .map(i => buildFeature(i, highlightedIds, labelField)),
  }), [visibleItems, highlightedIds, labelField])

  return (
    <>
      {/* POLYGONS */}
      <Source id="data-polygons" type="geojson" data={polygonData}>
        <Layer
          id="data-layer-polygon-fill"
          type="fill"
          paint={{
            'fill-color': fillColorExpression(defaultFillColor) as unknown as string,
            'fill-opacity': layerOpacity,
          }}
        />
        <Layer
          id="data-layer-polygon-outline"
          type="line"
          paint={{
            'line-color': ['case', ['boolean', ['get', 'selected'], false], SELECTION_OUTLINE_COLOR, strokeColor] as unknown as string,
            'line-width': ['case', ['boolean', ['get', 'selected'], false], strokeWidth + SELECTION_LINE_WIDTH_DELTA, strokeWidth] as unknown as number,
            'line-opacity': strokeOpacity,
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
            'line-color': fillColorExpression(strokeColor) as unknown as string,
            'line-width': ['case', ['boolean', ['get', 'selected'], false], lineWidth + SELECTION_LINE_WIDTH_DELTA, lineWidth] as unknown as number,
            'line-opacity': strokeOpacity,
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
              'circle-radius': ['case', ['boolean', ['get', 'selected'], false], layerWidth + SELECTION_POINT_RADIUS_DELTA, layerWidth] as unknown as number,
              'circle-color': fillColorExpression(defaultFillColor) as unknown as string,
              'circle-stroke-width': strokeWidth,
              'circle-stroke-color': ['case', ['boolean', ['get', 'selected'], false], SELECTION_OUTLINE_COLOR, strokeColor] as unknown as string,
              'circle-opacity': layerOpacity,
              'circle-stroke-opacity': strokeOpacity,
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
