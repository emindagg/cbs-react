/**
 * Shared label layer utility
 * Applies viz-name-labels / viz-value-labels symbol layers.
 *
 * No background — text readability via strong white halo.
 * Single combined format-expression layer when both name + value are active:
 * one collision box, natural line-break, no manual offset math.
 */

import type { Map } from 'maplibre-gl'

import type { VisualizationSettings } from '@/types/visualization'

// ── Text sizes (zoom-interpolated) ──────────────────────────────────────────
type ExprVal = unknown
type PaintVal = Parameters<Map['setPaintProperty']>[2]

const NAME_SIZE_MAX = 14  // px at zoom 10
const nameSizeExpr: ExprVal = ['interpolate', ['linear'], ['zoom'], 5, 10, 7, 12, 10, NAME_SIZE_MAX]
const valueSizeExpr: ExprVal = ['interpolate', ['linear'], ['zoom'], 5, 9, 7, 10, 10, 12]

// ── Text fields ─────────────────────────────────────────────────────────────
const nameFieldExpr: ExprVal = ['get', 'displayName']
const valueFieldExpr: ExprVal = ['get', 'formattedValue']

// Combined: name (100%) + newline + value (85%) — per-section text-color override
function buildCombinedFieldExpr(labelColor: string, valueColor: string): ExprVal {
  return [
    'format',
    ['get', 'displayName'], { 'font-scale': 1.0, 'text-color': labelColor },
    ['case', ['==', ['get', 'hasData'], true], '\n', ''], {},
    ['case', ['==', ['get', 'hasData'], true], ['get', 'formattedValue'], ''],
    { 'font-scale': 0.85, 'text-color': valueColor },
  ]
}

type LayerFilter = NonNullable<Parameters<Map['setFilter']>[1]>

// ── Main export ─────────────────────────────────────────────────────────────
export function applyLabelLayers(map: Map, sourceId: string, settings: VisualizationSettings): void {
  if (map.getLayer('viz-name-labels')) map.removeLayer('viz-name-labels')
  if (map.getLayer('viz-value-labels')) map.removeLayer('viz-value-labels')

  const showLabels = settings.showLabels ?? false
  const showValues = settings.showValues ?? false
  if (!showLabels && !showValues) return

  const labelColor = settings.labelColor ?? '#000000'
  const valueColor = settings.valueColor ?? '#000000'

  const isTransparentOutOfRange = settings.customRange?.enabled
    && settings.customRange?.outOfRangeMode === 'transparent'
  const nameFilter: LayerFilter = isTransparentOutOfRange
    ? ['==', ['get', 'inCustomRange'], true] as LayerFilter
    : (settings.dataOnlyMode
      ? ['==', ['get', 'hasData'], true]
      : ['all']) as LayerFilter
  const valueFilter: LayerFilter = isTransparentOutOfRange
    ? ['all', ['==', ['get', 'hasData'], true], ['==', ['get', 'inCustomRange'], true]] as LayerFilter
    : ['==', ['get', 'hasData'], true] as LayerFilter

  if (showLabels && showValues) {
    // Single layer: name + value in one format expression, per-section colors
    map.addLayer({
      id: 'viz-name-labels',
      type: 'symbol',
      source: sourceId,
      filter: nameFilter,
      layout: {
        'text-field': buildCombinedFieldExpr(labelColor, valueColor) as PaintVal,
        'text-size': nameSizeExpr as PaintVal,
        'text-anchor': 'center',
        'text-max-width': 8,
        'text-padding': 3,
      },
      paint: { 'text-color': labelColor as PaintVal },
    })
    return
  }

  if (showLabels) {
    map.addLayer({
      id: 'viz-name-labels',
      type: 'symbol',
      source: sourceId,
      filter: nameFilter,
      layout: {
        'text-field': nameFieldExpr as PaintVal,
        'text-size': nameSizeExpr as PaintVal,
        'text-anchor': 'center',
        'text-max-width': 8,
        'text-padding': 3,
      },
      paint: { 'text-color': labelColor as PaintVal },
    })
  }

  if (showValues) {
    map.addLayer({
      id: 'viz-value-labels',
      type: 'symbol',
      source: sourceId,
      filter: valueFilter,
      layout: {
        'text-field': valueFieldExpr as PaintVal,
        'text-size': valueSizeExpr as PaintVal,
        'text-anchor': 'center',
        'text-padding': 3,
      },
      paint: { 'text-color': valueColor as PaintVal },
    })
  }
}
