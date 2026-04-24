import { useEffect, useRef } from 'react'

import { useDataManagementStore } from '@/stores/useDataManagementStore'
import { useMapStore } from '@/stores/useMapStore'

type Coordinates = [number, number]

const FIT_PADDING = 80
const FIT_DURATION_MS = 1200
const FIT_MAX_ZOOM = 14
const MIN_BOUNDS_DELTA = 0.0005

function collectCoordinates(geometry: GeoJSON.Geometry): Coordinates[] {
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.flatMap(g => collectCoordinates(g))
  }

  const result: Coordinates[] = []

  const traverse = (value: unknown) => {
    if (!Array.isArray(value)) return

    if (
      value.length >= 2
      && typeof value[0] === 'number'
      && typeof value[1] === 'number'
      && Number.isFinite(value[0])
      && Number.isFinite(value[1])
    ) {
      result.push([value[0], value[1]])
      return
    }

    value.forEach(traverse)
  }

  traverse(geometry.coordinates)
  return result
}

function getBounds(items: ReturnType<typeof useDataManagementStore.getState>['items']) {
  let minLng = Number.POSITIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  for (const item of items) {
    const coordinates = collectCoordinates(item.geometry)
    for (const [lng, lat] of coordinates) {
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
    }
  }

  if (
    !Number.isFinite(minLng)
    || !Number.isFinite(minLat)
    || !Number.isFinite(maxLng)
    || !Number.isFinite(maxLat)
  ) {
    return null
  }

  if (maxLng - minLng < MIN_BOUNDS_DELTA) {
    minLng -= MIN_BOUNDS_DELTA / 2
    maxLng += MIN_BOUNDS_DELTA / 2
  }

  if (maxLat - minLat < MIN_BOUNDS_DELTA) {
    minLat -= MIN_BOUNDS_DELTA / 2
    maxLat += MIN_BOUNDS_DELTA / 2
  }

  return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]]
}

export function useImportedDataAutoFit() {
  const mapInstance = useMapStore(state => state.mapInstance)
  const items = useDataManagementStore(state => state.items)
  const previousImportedIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!mapInstance) return

    const importedItems = items.filter(item => item.source === 'imported')
    const currentImportedIds = new Set(importedItems.map(item => item.id))
    const previousImportedIds = previousImportedIdsRef.current

    const newlyImportedItems = importedItems.filter(item => !previousImportedIds.has(item.id))
    previousImportedIdsRef.current = currentImportedIds

    if (newlyImportedItems.length === 0) return

    const bounds = getBounds(newlyImportedItems)
    if (!bounds) return

    mapInstance.fitBounds(bounds, {
      padding: FIT_PADDING,
      duration: FIT_DURATION_MS,
      maxZoom: FIT_MAX_ZOOM,
      essential: true,
    })
  }, [mapInstance, items])
}
