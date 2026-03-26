import { useEffect, useRef, useCallback, useMemo } from 'react'

import { useDataManagementStore } from '@/stores/useDataManagementStore'
import { useMapStore } from '@/stores/useMapStore'

import { HeatmapRenderer } from '../services/HeatmapRenderer'
import { useHeatmapStore } from '../stores/useHeatmapStore'

function buildGeoJSON(items: { geometry: GeoJSON.Geometry; properties: Record<string, unknown>; visible: boolean }[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = []

  for (const item of items) {
    if (!item.visible) continue
    const geom = item.geometry

    if (geom.type === 'Point') {
      features.push({
        type: 'Feature',
        geometry: geom,
        properties: { ...item.properties },
      })
    } else if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      const coords = geom.type === 'Polygon'
        ? geom.coordinates[0]
        : geom.coordinates.flat(1)[0]
      if (!coords || coords.length === 0) continue
      const [sumLon, sumLat] = coords.reduce(
        ([sLon, sLat], [lon, lat]) => [sLon + lon, sLat + lat],
        [0, 0],
      )
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [sumLon / coords.length, sumLat / coords.length],
        },
        properties: { ...item.properties },
      })
    } else if (geom.type === 'LineString') {
      const mid = geom.coordinates[Math.floor(geom.coordinates.length / 2)]
      if (!mid) continue
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: mid },
        properties: { ...item.properties },
      })
    }
  }

  return { type: 'FeatureCollection', features }
}

export function useHeatmap() {
  const map = useMapStore((s) => s.mapInstance)
  const items = useDataManagementStore((s) => s.items)
  const importedItems = useMemo(
    () => items.filter((i) => i.source === 'imported' || i.source === 'drawn'),
    [items],
  )

  const { isActive, config, activePreset, toggle, deactivate, setConfig, applyPreset, isPanelOpen, setPanelOpen } = useHeatmapStore()
  const rendererRef = useRef<HeatmapRenderer | null>(null)

  const numericFields = useMemo(() => {
    if (importedItems.length === 0) return []
    const sample = importedItems.slice(0, 20)
    const fields = new Set<string>()

    for (const item of sample) {
      for (const [key, val] of Object.entries(item.properties)) {
        if (key === 'style' || key === 'analysis') continue
        if (typeof val === 'number' && isFinite(val)) {
          fields.add(key)
        } else if (typeof val === 'string' && val.trim() !== '' && isFinite(Number(val))) {
          fields.add(key)
        }
      }
    }
    return Array.from(fields).sort()
  }, [importedItems])

  const getRenderer = useCallback(() => {
    if (!map) return null
    if (!rendererRef.current) {
      rendererRef.current = new HeatmapRenderer(map)
    }
    return rendererRef.current
  }, [map])

  useEffect(() => {
    const renderer = getRenderer()
    if (!renderer) return

    if (isActive && importedItems.length > 0) {
      const normalizedItems = config.weightField
        ? normalizeWeightField(importedItems, config.weightField)
        : importedItems

      const geojson = buildGeoJSON(normalizedItems)
      renderer.render(geojson, config)
    } else if (!isActive) {
      renderer.remove()
    }
  }, [isActive, importedItems, config, getRenderer])

  useEffect(() => {
    return () => {
      rendererRef.current?.remove()
      rendererRef.current = null
    }
  }, [map])

  return {
    isActive,
    config,
    activePreset,
    toggle,
    deactivate,
    setConfig,
    applyPreset,
    isPanelOpen,
    setPanelOpen,
    numericFields,
    pointCount: importedItems.length,
    hasData: importedItems.length > 0,
  }
}

function normalizeWeightField(
  items: { geometry: GeoJSON.Geometry; properties: Record<string, unknown>; visible: boolean }[],
  field: string,
): typeof items {
  let min = Infinity
  let max = -Infinity

  for (const item of items) {
    const raw = item.properties[field]
    const num = typeof raw === 'number' ? raw : Number(raw)
    if (isFinite(num)) {
      if (num < min) min = num
      if (num > max) max = num
    }
  }

  const range = max - min
  if (range === 0) return items

  return items.map((item) => {
    const raw = item.properties[field]
    const num = typeof raw === 'number' ? raw : Number(raw)
    const normalized = isFinite(num) ? (num - min) / range : 0

    return {
      ...item,
      properties: { ...item.properties, [field]: normalized },
    }
  })
}
