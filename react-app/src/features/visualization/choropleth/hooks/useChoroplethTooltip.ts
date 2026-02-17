import maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'

import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

const CHOROPLETH_LAYER_ID = 'choropleth-fill'

function formatValue(value: unknown): string {
  if (typeof value === 'number') {
    return value.toLocaleString('tr-TR')
  }
  return String(value ?? '-')
}

export function useChoroplethTooltip() {
  const map = useMapStore((state) => state.mapInstance)
  const vizType = useVisualizationStore((state) => state.currentVisualization.type)
  const dataColumn = useVisualizationStore((state) => state.columnMapping.dataColumn)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  useEffect(() => {
    if (!map || vizType !== 'choropleth') return
    if (!map.getLayer(CHOROPLETH_LAYER_ID)) return

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'choropleth-tooltip',
      maxWidth: '260px',
      offset: 12,
    })
    popupRef.current = popup

    const onMouseMove = (e: maplibregl.MapMouseEvent & { features?: maplibregl.GeoJSONFeature[] }) => {
      const feature = e.features?.[0]
      if (!feature) return

      map.getCanvas().style.cursor = 'pointer'

      const name = String(feature.properties?.displayName || feature.properties?.name || 'Bilinmiyor')
      const value = feature.properties?.dataValue
      const label = dataColumn || 'Değer'

      popup
        .setLngLat(e.lngLat)
        .setHTML(
          '<div style="font-family:system-ui,sans-serif;padding:2px 0">' +
          `<div style="font-size:14px;font-weight:700;color:#0f172a">${name}</div>` +
          '<div style="margin-top:4px;font-size:11px;color:#64748b">' +
          `${label}` +
          '</div>' +
          `<div style="font-size:13px;font-weight:600;color:#1e293b">${formatValue(value)}</div>` +
          '</div>',
        )
        .addTo(map)
    }

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = ''
      popup.remove()
    }

    map.on('mousemove', CHOROPLETH_LAYER_ID, onMouseMove)
    map.on('mouseleave', CHOROPLETH_LAYER_ID, onMouseLeave)

    return () => {
      map.off('mousemove', CHOROPLETH_LAYER_ID, onMouseMove)
      map.off('mouseleave', CHOROPLETH_LAYER_ID, onMouseLeave)
      map.getCanvas().style.cursor = ''
      popup.remove()
      popupRef.current = null
    }
  }, [map, vizType, dataColumn])
}
