import * as turf from '@turf/turf'
import type { FeatureCollection, LineString, Point, Polygon } from 'geojson'
import { useCallback, useEffect, useMemo } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'

import { useDataManagementStore } from '../store/useDataManagementStore'

export function DataManagementDrawTool() {
  const { current: map } = useMap()
  const {
    drawMode,
    isDrawing,
    drawPoints,
    drawGhostPoint,
    setDrawPoints,
    setDrawGhostPoint,
    setIsDrawing,
    resetDraw,
  } = useDataManagementStore()

  const handleMouseMove = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isDrawing) return

    const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat]
    setDrawGhostPoint(lngLat)

    if (map) map.getCanvas().style.cursor = 'crosshair'
  }, [isDrawing, map, setDrawGhostPoint])

  const handleClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isDrawing) return

    const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat]

    if (drawMode === 'point') {
      setDrawPoints([lngLat])
      setIsDrawing(false)
      setDrawGhostPoint(null)
      if (map) map.getCanvas().style.cursor = 'grab'
    } else if (drawMode === 'line' || drawMode === 'polygon') {
      setDrawPoints([...drawPoints, lngLat])
    }
  }, [isDrawing, drawMode, drawPoints, setDrawPoints, setIsDrawing, setDrawGhostPoint, map])

  const handleDblClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isDrawing) return
    if (drawMode === 'line' || drawMode === 'polygon') {
      e.preventDefault()
      setIsDrawing(false)
      setDrawGhostPoint(null)
      if (map) map.getCanvas().style.cursor = 'grab'
    }
  }, [isDrawing, drawMode, map, setIsDrawing, setDrawGhostPoint])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isDrawing) return
    if (e.key === 'Escape') {
      resetDraw()
      if (map) map.getCanvas().style.cursor = 'grab'
    }
  }, [isDrawing, resetDraw, map])

  useEffect(() => {
    if (!map || drawMode === 'none') return

    map.on('mousemove', handleMouseMove)
    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)
    document.addEventListener('keydown', handleKeyDown)

    if (isDrawing) {
      map.getCanvas().style.cursor = 'crosshair'
    }

    return () => {
      map.off('mousemove', handleMouseMove)
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
      document.removeEventListener('keydown', handleKeyDown)
      map.getCanvas().style.cursor = ''
    }
  }, [map, drawMode, isDrawing, handleMouseMove, handleClick, handleDblClick, handleKeyDown])

  const drawGeoJSON = useMemo((): FeatureCollection<LineString | Polygon | Point> => {
    const features: GeoJSON.Feature<LineString | Polygon | Point>[] = []

    if (drawMode === 'line' || drawMode === 'polygon') {
      drawPoints.forEach(pt => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: pt },
          properties: { type: 'vertex' },
        })
      })
    }

    if (drawMode === 'line' && drawPoints.length > 0) {
      const coords = [...drawPoints]
      if (isDrawing && drawGhostPoint) coords.push(drawGhostPoint)

      if (coords.length > 1) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: { type: 'line' },
        })
      }
    } else if (drawMode === 'polygon' && drawPoints.length > 0) {
      const coords = [...drawPoints]
      if (isDrawing && drawGhostPoint) coords.push(drawGhostPoint)

      if (coords.length > 2) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] },
          properties: { type: 'polygon' },
        })
      } else if (coords.length > 1) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: { type: 'line' },
        })
      }
    } else if (drawMode === 'point' && drawPoints.length > 0) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: drawPoints[0] },
        properties: { type: 'point' },
      })
    }

    return { type: 'FeatureCollection', features }
  }, [drawMode, drawPoints, drawGhostPoint, isDrawing])

  if (drawMode === 'none') return null

  return (
    <Source id="draw-source" type="geojson" data={drawGeoJSON}>
      <Layer
        id="draw-fill"
        type="fill"
        filter={['any', ['==', '$type', 'Polygon']]}
        paint={{
          'fill-color': '#3b82f6',
          'fill-opacity': 0.2,
        }}
      />

      <Layer
        id="draw-line"
        type="line"
        filter={['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']]}
        paint={{
          'line-color': '#2563eb',
          'line-width': 2,
          'line-dasharray': ['case', ['==', ['get', 'type'], 'guide'], ['literal', [2, 2]], ['literal', [1, 0]]],
        }}
      />

      <Layer
        id="draw-point"
        type="circle"
        filter={['==', '$type', 'Point']}
        paint={{
          'circle-radius': 6,
          'circle-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#2563eb',
        }}
      />
    </Source>
  )
}

