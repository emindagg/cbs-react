/**
 * useBubbleTooltip
 * Kabarcık haritası üzerinde hover tooltip gösterimi.
 * Sütun adı, değer, sıralama ve yüzdelik dilim bilgisi gösterir.
 */

import maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'

import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

import {
  PERCENTILE_HIGH_THRESHOLD,
  PERCENTILE_LOW_THRESHOLD,
  PERCENTILE_MEDIUM_THRESHOLD,
} from '../constants/tooltip'

const BUBBLE_LAYER_ID = 'bubble-circles'
const BUBBLE_SOURCE_ID = 'bubble-source'

function formatTR(value: unknown): string {
  return typeof value === 'number'
    ? value.toLocaleString('tr-TR')
    : String(value ?? '')
}

/** Yüzdelik dilim hesapla (0-100) */
function percentileOf(value: number, sortedValues: number[]): number {
  const below = sortedValues.filter((v) => v < value).length
  return Math.round((below / sortedValues.length) * 100)
}

/** Sıralama bul (1 = en yüksek) */
function rankOf(value: number, descValues: number[]): number {
  const idx = descValues.indexOf(value)
  return idx >= 0 ? idx + 1 : descValues.length
}

/** Yüzdelik dilim için kısa açıklama etiketi */
function percentileLabel(pct: number): string {
  if (pct >= 90) return 'Çok yüksek'
  if (pct >= PERCENTILE_HIGH_THRESHOLD) return 'Yüksek'
  if (pct >= 50) return 'Ortanın üstü'
  if (pct >= PERCENTILE_LOW_THRESHOLD) return 'Ortanın altı'
  if (pct >= 10) return 'Düşük'
  return 'Çok düşük'
}

function percentileBadgeColor(pct: number): string {
  if (pct >= PERCENTILE_HIGH_THRESHOLD) return '#16a34a'
  if (pct >= PERCENTILE_MEDIUM_THRESHOLD) return '#ca8a04'
  if (pct >= PERCENTILE_LOW_THRESHOLD) return '#ea580c'
  return '#dc2626'
}

export function useBubbleTooltip() {
  const map = useMapStore((state) => state.mapInstance)
  const vizType = useVisualizationStore((state) => state.currentVisualization.type)
  const vizSettings = useVisualizationStore((state) => state.vizSettings)
  const columnMapping = useVisualizationStore((state) => state.columnMapping)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  // Sıralı değer cache'i — her render'da yeniden hesaplanmasın
  const sizeValuesRef = useRef<{ sorted: number[]; desc: number[] }>({ sorted: [], desc: [] })
  const colorValuesRef = useRef<{ sorted: number[]; desc: number[] }>({ sorted: [], desc: [] })

  const colorColumn = vizSettings.colorColumn
  const dataColumn = columnMapping.dataColumn

  useEffect(() => {
    if (!map || vizType !== 'bubble') return
    if (!map.getLayer(BUBBLE_LAYER_ID)) return

    const isBivariate = colorColumn && colorColumn !== dataColumn

    // Source'dan tüm feature değerlerini çek ve sırala (bir kez)
    const buildValueCache = () => {
      const source = map.getSource(BUBBLE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
      if (!source) return

      // querySourceFeatures ile tüm feature'ları al
      const features = map.querySourceFeatures(BUBBLE_SOURCE_ID)
      if (features.length === 0) return

      const sizeVals = features
        .map((f) => f.properties?.dataValue as number)
        .filter((v) => typeof v === 'number' && !isNaN(v))
      const sizeAsc = [...sizeVals].sort((a, b) => a - b)
      const sizeDesc = [...sizeVals].sort((a, b) => b - a)
      sizeValuesRef.current = { sorted: sizeAsc, desc: sizeDesc }

      if (isBivariate) {
        const colorVals = features
          .map((f) => f.properties?.colorValue as number)
          .filter((v) => typeof v === 'number' && !isNaN(v))
        const colorAsc = [...colorVals].sort((a, b) => a - b)
        const colorDesc = [...colorVals].sort((a, b) => b - a)
        colorValuesRef.current = { sorted: colorAsc, desc: colorDesc }
      } else {
        colorValuesRef.current = sizeValuesRef.current
      }
    }

    // İlk yüklemede ve data değiştiğinde cache'i yenile
    buildValueCache()
    map.on('sourcedata', buildValueCache)

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'bubble-tooltip',
      maxWidth: '280px',
      offset: 12,
    })
    popupRef.current = popup

    const onMouseEnter = (e: maplibregl.MapMouseEvent & { features?: maplibregl.GeoJSONFeature[] }) => {
      map.getCanvas().style.cursor = 'pointer'

      const feature = e.features?.[0]
      if (!feature) return

      const name = feature.properties?.displayName || feature.properties?.name || ''
      const sizeVal = feature.properties?.dataValue as number
      const colorVal = feature.properties?.colorValue as number
      const total = sizeValuesRef.current.sorted.length

      /** @param indicator — bivariate modda 'size' | 'color' | null */
      const buildRow = (
        label: string,
        value: number,
        cache: { sorted: number[]; desc: number[] },
        indicator: 'size' | 'color' | null = null,
      ) => {
        const pct = percentileOf(value, cache.sorted)
        const rank = rankOf(value, cache.desc)
        const pLabel = percentileLabel(pct)
        const badgeColor = percentileBadgeColor(pct)

        // Bivariate gösterge ikonu (sadece ikon, etiket yok)
        let indicatorHtml = ''
        if (indicator === 'size') {
          indicatorHtml =
            '<span style="display:inline-flex;align-items:center;margin-right:4px" title="Daire boyutunu belirler">' +
            '<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="none" stroke="#555" stroke-width="1.2"/></svg>' +
            '</span>'
        } else if (indicator === 'color') {
          indicatorHtml =
            '<span style="display:inline-flex;align-items:center;margin-right:4px" title="Daire rengini belirler">' +
            '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:linear-gradient(135deg,#da7756,#3b82f6)"></span>' +
            '</span>'
        }

        return (
          '<div style="margin-top:4px">' +
          `<div style="font-size:11px;color:#888;display:flex;align-items:center">${indicatorHtml}${label}</div>` +
          `<div style="font-size:13px;font-weight:600;color:#1a1a2e">${formatTR(value)}</div>` +
          '<div style="font-size:10px;color:#777;margin-top:1px">' +
          `${rank}/${total} sırada` +
          `<span style="margin-left:6px;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:600;color:white;background:${badgeColor}">${pLabel}</span>` +
          '</div>' +
          '</div>'
        )
      }

      let rows: string

      if (isBivariate && colorVal !== sizeVal) {
        rows =
          buildRow(dataColumn!, sizeVal, sizeValuesRef.current, 'size') +
          '<div style="border-top:1px solid #eee;margin-top:5px;padding-top:4px"></div>' +
          buildRow(colorColumn!, colorVal, colorValuesRef.current, 'color')
      } else {
        rows = buildRow(dataColumn!, sizeVal, sizeValuesRef.current)
      }

      popup
        .setLngLat(e.lngLat)
        .setHTML(
          '<div style="font-family:system-ui,sans-serif;padding:3px 0">' +
          `<div style="font-weight:700;font-size:14px;color:#0f172a;border-bottom:1px solid #eee;padding-bottom:4px">${name}</div>` +
          rows +
          '</div>',
        )
        .addTo(map)
    }

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = ''
      popup.remove()
    }

    map.on('mouseenter', BUBBLE_LAYER_ID, onMouseEnter)
    map.on('mouseleave', BUBBLE_LAYER_ID, onMouseLeave)

    return () => {
      map.off('sourcedata', buildValueCache)
      map.off('mouseenter', BUBBLE_LAYER_ID, onMouseEnter)
      map.off('mouseleave', BUBBLE_LAYER_ID, onMouseLeave)
      popup.remove()
      popupRef.current = null
    }
  }, [map, vizType, colorColumn, dataColumn])
}
