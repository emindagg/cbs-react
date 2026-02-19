import type { FeatureCollection, Feature } from 'geojson'
import { useMemo, useCallback } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'

import { useClusteringStore } from '@/stores/useClusteringStore'
import { type StyleProperties, isStyleProperties } from '@/types/style'

import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'

export default function DataLayer() {
  const { items, activeItemId, layerStyles } = useDataManagementStore()
  const { isEnabled: isClusteringEnabled } = useClusteringStore()

  // Helper to flatten properties and inject consistent style defaults
  const prepareFeatures = useCallback((itemType: 'Point' | 'LineString' | 'Polygon') => {
    return items
      .filter(i => i.visible && (i.geometry.type === itemType || i.geometry.type === `Multi${itemType}`))
      .map(i => {
        const rawStyle = i.properties.style
        const style: StyleProperties = isStyleProperties(rawStyle) ? rawStyle : {}
        const isImported = i.source === 'imported'
        const opacity = isImported
          ? layerStyles.opacity
          : (style.opacity !== undefined ? style.opacity : 0.9)
        const fillColor = isImported
          ? layerStyles.fillColor
          : (style.fillColor || '#3b82f6')
        const strokeColor = isImported
          ? layerStyles.strokeColor
          : (style.strokeColor || '#000000')
        const strokeWidth = isImported
          ? layerStyles.strokeWidth
          : (style.strokeWidth || 1)
        const radius = isImported
          ? layerStyles.width
          : (style.radius || 4)
        const lineWidth = isImported
          ? layerStyles.width
          : 2
        const labelValue = isImported && layerStyles.labelField
          ? i.properties[layerStyles.labelField]
          : undefined

        // LEGACY DEFAULTS (Exact match from LayerStylePanel.js)
        // Default Color: #3b82f6 (Blue-500)
        // Default Stroke: #000000 (Black)

        return {
          type: 'Feature',
          id: i.id,
          geometry: i.geometry,
          properties: {
            ...i.properties,
            name: i.name,
            id: i.id,
            selected: i.id === activeItemId,
            // Legacy Style Mapping
            fillColor,
            strokeColor,
            strokeWidth,
            opacity,
            radius,
            lineWidth,
            labelText: labelValue !== undefined && labelValue !== null ? String(labelValue) : '',
            textColor: layerStyles.textColor,
            textSize: layerStyles.textSize,

            // Calculated Fill Opacity for Polygons (Legacy logic: opacity * 0.3)
            fillOpacity: opacity * 0.3,
          },
        }
      }) as unknown as Feature[]
  }, [items, activeItemId, layerStyles])

  const pointData = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: prepareFeatures('Point'),
  }), [prepareFeatures])

  const lineData = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: prepareFeatures('LineString'),
  }), [prepareFeatures])

  const polygonData = useMemo((): FeatureCollection => ({
    type: 'FeatureCollection',
    features: prepareFeatures('Polygon'),
  }), [prepareFeatures])

  return (
    <>
      {/* --- POLYGONS --- */}
      <Source id="data-polygons" type="geojson" data={polygonData}>
        <Layer
          id="data-layer-polygon-fill"
          type="fill"
          paint={{
            'fill-color': ['case',
              ['boolean', ['get', 'selected'], false],
              '#f59e0b', // Amber if selected
              ['get', 'fillColor'],
            ],
            'fill-opacity': ['get', 'fillOpacity'], // Uses the * 0.3 logic
          }}
        />
        <Layer
          id="data-layer-polygon-outline"
          type="line"
          paint={{
            'line-color': ['case',
              ['boolean', ['get', 'selected'], false],
              '#d97706',
              ['get', 'strokeColor'],
            ],
            'line-width': ['case',
              ['boolean', ['get', 'selected'], false],
              2,
              ['get', 'strokeWidth'],
            ],
            'line-opacity': ['get', 'opacity'], // Full opacity for outlines
          }}
        />
        <Layer
          id="data-layer-polygon-labels"
          type="symbol"
          layout={{
            'text-field': ['coalesce', ['get', 'labelText'], ''],
            'text-size': ['get', 'textSize'],
          }}
          paint={{
            'text-color': ['get', 'textColor'],
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
          }}
        />
      </Source>

      {/* --- LINES --- */}
      <Source id="data-lines" type="geojson" data={lineData}>
        <Layer
          id="data-layer-line"
          type="line"
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
          paint={{
            'line-color': ['case',
              ['boolean', ['get', 'selected'], false],
              '#f59e0b',
              ['get', 'fillColor'], // Lines usually use 'fillColor' property in this context as main color
            ],
            'line-width': ['case',
              ['boolean', ['get', 'selected'], false],
              4,
              ['get', 'lineWidth'],
            ],
            'line-opacity': ['get', 'opacity'],
          }}
        />
        <Layer
          id="data-layer-line-labels"
          type="symbol"
          layout={{
            'text-field': ['coalesce', ['get', 'labelText'], ''],
            'text-size': ['get', 'textSize'],
            'symbol-placement': 'line-center',
          }}
          paint={{
            'text-color': ['get', 'textColor'],
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
          }}
        />
      </Source>

      {/* --- POINTS --- */}
      {/* Only render points here if clustering is DISABLED to avoid duplicates */}
      {!isClusteringEnabled && (
        <Source id="data-points" type="geojson" data={pointData}>
          <Layer
            id="data-layer-point"
            type="circle"
            paint={{
              'circle-radius': ['get', 'radius'],
              'circle-color': ['case',
                ['boolean', ['get', 'selected'], false],
                '#f59e0b',
                ['get', 'fillColor'],
              ],
              'circle-stroke-width': ['get', 'strokeWidth'],
              'circle-stroke-color': ['get', 'strokeColor'],
              'circle-opacity': ['get', 'opacity'],
            }}
          />
          <Layer
            id="data-layer-point-labels"
            type="symbol"
            layout={{
              'text-field': ['coalesce', ['get', 'labelText'], ''],
              'text-size': ['get', 'textSize'],
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
            }}
            paint={{
              'text-color': ['get', 'textColor'],
              'text-halo-color': '#ffffff',
              'text-halo-width': 1,
            }}
          />

        </Source>
      )}
    </>
  )
}
