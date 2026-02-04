import * as turf from '@turf/turf'
import type { FeatureCollection, LineString, Polygon, Point } from 'geojson'
import { useEffect, useCallback, useMemo } from 'react'
import { useMap, Source, Layer } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

export default function DrawTool() {
  const { current: map } = useMap()
  const {
    drawMode,
    isDrawing,
    drawPoints,
    drawGhostPoint,
    drawCenter,
    drawRadius,
    setDrawPoints,
    setDrawGhostPoint,
    setDrawCenter,
    setDrawRadius,
    setIsDrawing,
    resetDraw,
  } = useToolStore()

  // --- Interaction Logic ---

  const handleMouseMove = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isDrawing) return

    const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat]
    setDrawGhostPoint(lngLat)

    if (drawMode === 'circle' && drawCenter) {
      // Calculate radius in real-time
      const from = turf.point(drawCenter)
      const to = turf.point(lngLat)
      const distance = turf.distance(from, to, { units: 'kilometers' })
      setDrawRadius(distance)
    }

    if (map) map.getCanvas().style.cursor = 'crosshair'
  }, [isDrawing, drawMode, drawCenter, map, setDrawGhostPoint, setDrawRadius])

  const handleClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isDrawing) return

    const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat]

    if (drawMode === 'point') {
      // Single point mode: Add and finish
      setDrawPoints([lngLat])
      setIsDrawing(false) // Finish immediately
      setDrawGhostPoint(null)
      if (map) map.getCanvas().style.cursor = 'grab'
    }
    else if (drawMode === 'line' || drawMode === 'polygon') {
      // Multi-point mode
      setDrawPoints([...drawPoints, lngLat])
    }
    else if (drawMode === 'circle') {
      if (!drawCenter) {
        // First click: Set Center
        setDrawCenter(lngLat)
      } else {
        // Second click: Set Radius and Finish
        // Radius is already updating via mousemove, just finalize
        setIsDrawing(false)
        setDrawGhostPoint(null)
        if (map) map.getCanvas().style.cursor = 'grab'
      }
    }

  }, [isDrawing, drawMode, drawPoints, drawCenter, setDrawPoints, setIsDrawing, setDrawGhostPoint, setDrawCenter, map])

  const handleDblClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isDrawing) return
    if (drawMode === 'line' || drawMode === 'polygon') {
      e.preventDefault()
      // Finish drawing
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

  // Attach/Detach Listeners
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


  // --- GeoJSON Generation ---

  const drawGeoJSON = useMemo((): FeatureCollection<LineString | Polygon | Point> => {
    const features: GeoJSON.Feature<LineString | Polygon | Point>[] = []

    // Points (Vertices)
    // Show vertices for line/polygon while drawing
    if (drawMode === 'line' || drawMode === 'polygon') {
      drawPoints.forEach(pt => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: pt },
          properties: { type: 'vertex' },
        })
      })
    }

    // Active Shape
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
    }
    else if (drawMode === 'polygon' && drawPoints.length > 0) {
      const coords = [...drawPoints]
      if (isDrawing && drawGhostPoint) coords.push(drawGhostPoint)

      if (coords.length > 2) {
        // Closed polygon for preview
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] },
          properties: { type: 'polygon' },
        })
      } else if (coords.length > 1) {
        // Line preview until 3 points
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: { type: 'line' },
        })
      }
    }
    else if (drawMode === 'point' && drawPoints.length > 0) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: drawPoints[0] },
        properties: { type: 'point' },
      })
    }
    else if (drawMode === 'circle' && drawCenter) {
      // Center Point
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: drawCenter },
        properties: { type: 'center' },
      })

      // Circle Polygon (if radius exists)
      if (drawRadius) {
        const circle = turf.circle(drawCenter, drawRadius, { steps: 64, units: 'kilometers' })
        features.push(circle)

        // Guide Line (Center to Mouse/Ghost)
        if (isDrawing && drawGhostPoint) {
          features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [drawCenter, drawGhostPoint] },
            properties: { type: 'guide' },
          })
        }
      }
    }

    return { type: 'FeatureCollection', features }
  }, [drawMode, drawPoints, drawGhostPoint, drawCenter, drawRadius, isDrawing])


  if (drawMode === 'none') return null

  return (
    <Source id="draw-source" type="geojson" data={drawGeoJSON}>
      {/* Fill for Polygon/Circle */}
      <Layer
        id="draw-fill"
        type="fill"
        filter={['any', ['==', '$type', 'Polygon']]}
        paint={{
          'fill-color': '#3b82f6',
          'fill-opacity': 0.2,
        }}
      />

      {/* Outline/Line */}
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

      {/* Points (Vertices/Center/Point) */}
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
