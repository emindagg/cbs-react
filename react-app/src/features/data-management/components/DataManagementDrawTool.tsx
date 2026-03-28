import * as turf from '@turf/turf'
import type { FeatureCollection, LineString, Point, Polygon } from 'geojson'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'

import { useDataManagementStore } from '../store/useDataManagementStore'

// Vertex bg rengi — Monokrom Editoryal: node.fill
const VERTEX_BG = '#fffdf9'

export function DataManagementDrawTool() {
  const { current: map } = useMap()
  const {
    drawMode,
    isDrawing,
    drawPoints,
    drawGhostPoint,
    layerStyles,
    setDrawPoints,
    setDrawGhostPoint,
    setIsDrawing,
    resetDraw,
    updateDrawPoint,
  } = useDataManagementStore()

  const isDraggingRef    = useRef(false)
  const draggingIndexRef = useRef<number | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (drawMode === 'none') {
      isDraggingRef.current    = false
      draggingIndexRef.current = null
    }
  }, [drawMode])

  // ── EVENT HANDLERS ──────────────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: maplibregl.MapMouseEvent) => {
    if (isDraggingRef.current && draggingIndexRef.current !== null) {
      updateDrawPoint(draggingIndexRef.current, [e.lngLat.lng, e.lngLat.lat])
      setCursorPos({ x: e.point.x, y: e.point.y })
      return
    }
    if (!isDrawing) return
    setDrawGhostPoint([e.lngLat.lng, e.lngLat.lat])
    setCursorPos({ x: e.point.x, y: e.point.y })
    if (map) map.getCanvas().style.cursor = 'crosshair'
  }, [isDrawing, map, setDrawGhostPoint, updateDrawPoint])

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
      // Çift tıklamada MapLibre iki click + bir dblclick üretir.
      // İkinci click'in eklediği duplicate son noktayı temizle.
      setDrawPoints(drawPoints.slice(0, -1))
      setIsDrawing(false)
      setDrawGhostPoint(null)
      if (map) map.getCanvas().style.cursor = 'grab'
    }
  }, [isDrawing, drawMode, drawPoints, map, setDrawPoints, setIsDrawing, setDrawGhostPoint])

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current    = false
    draggingIndexRef.current = null
    setDraggingIndex(null)
    map?.dragPan.enable()
    if (map) map.getCanvas().style.cursor = 'grab'
  }, [map])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isDraggingRef.current) {
        isDraggingRef.current    = false
        draggingIndexRef.current = null
        setDraggingIndex(null)
        map?.dragPan.enable()
        if (map) map.getCanvas().style.cursor = 'grab'
      } else {
        resetDraw()
        if (map) map.getCanvas().style.cursor = ''
      }
    }
  }, [resetDraw, map])

  useEffect(() => {
    if (!map || drawMode === 'none') return
    map.on('mousemove', handleMouseMove)
    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)
    map.on('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)
    if (isDrawing) map.getCanvas().style.cursor = 'crosshair'
    return () => {
      map.off('mousemove', handleMouseMove)
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
      map.off('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
      map.getCanvas().style.cursor = ''
    }
  }, [map, drawMode, isDrawing, handleMouseMove, handleClick, handleDblClick, handleMouseUp, handleKeyDown])

  // Vertex düzenleme — sadece edit modunda
  useEffect(() => {
    if (!map || drawMode === 'none' || isDrawing) return
    const onEnter = () => { if (!isDraggingRef.current) map.getCanvas().style.cursor = 'move' }
    const onLeave = () => { if (!isDraggingRef.current) map.getCanvas().style.cursor = 'grab' }
    const onDown  = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features?.length) return
      const idx = e.features[0].properties?.vertexIndex
      if (idx === undefined || idx === null) return
      draggingIndexRef.current = Number(idx)
      isDraggingRef.current    = true
      setDraggingIndex(Number(idx))
      map.dragPan.disable()
      map.getCanvas().style.cursor = 'grabbing'
      e.preventDefault()
    }
    map.on('mouseenter', 'draw-point', onEnter)
    map.on('mouseleave', 'draw-point', onLeave)
    map.on('mousedown',  'draw-point', onDown)
    return () => {
      map.off('mouseenter', 'draw-point', onEnter)
      map.off('mouseleave', 'draw-point', onLeave)
      map.off('mousedown',  'draw-point', onDown)
      if (isDraggingRef.current) { map.dragPan.enable(); isDraggingRef.current = false; draggingIndexRef.current = null }
    }
  }, [map, drawMode, isDrawing])

  // ── GeoJSON — basit yaklaşım, DataLayer ile aynı renk referansı ─────────────

  const drawGeoJSON = useMemo((): FeatureCollection<LineString | Polygon | Point> => {
    const features: GeoJSON.Feature<LineString | Polygon | Point>[] = []

    // Vertex noktaları
    if (drawMode === 'line' || drawMode === 'polygon') {
      drawPoints.forEach((pt, idx) => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: pt },
          properties: { type: 'vertex', vertexIndex: idx, active: idx === draggingIndex ? 1 : 0 },
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
          properties: {},
        })
      }
    } else if (drawMode === 'polygon' && drawPoints.length > 0) {
      const coords = [...drawPoints]
      if (isDrawing && drawGhostPoint) coords.push(drawGhostPoint)
      if (coords.length > 2) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] },
          properties: {},
        })
      } else if (coords.length > 1) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {},
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
  }, [drawMode, drawPoints, drawGhostPoint, isDrawing, draggingIndex])

  // ── MEASUREMENT ─────────────────────────────────────────────────────────────

  const measurement = useMemo(() => {
    const activePoints = (isDrawing && drawGhostPoint)
      ? [...drawPoints, drawGhostPoint]
      : drawPoints

    if (drawMode === 'line' && activePoints.length > 1) {
      const line = turf.lineString(activePoints)
      const km   = turf.length(line, { units: 'kilometers' })
      return km >= 1
        ? `${km.toFixed(2)} km`
        : `${(km * 1000).toFixed(0)} m`
    }

    if (drawMode === 'polygon' && activePoints.length > 2) {
      const poly = turf.polygon([[...activePoints, activePoints[0]]])
      const km2  = turf.area(poly) / 1_000_000
      return km2 >= 1
        ? `${km2.toFixed(2)} km²`
        : `${(km2 * 1_000_000).toFixed(0)} m²`
    }

    return null
  }, [drawMode, drawPoints, drawGhostPoint, isDrawing])

  if (drawMode === 'none') return null

  // DataLayer ile birebir aynı formüller — kaydetme sonrası görünüm eşleşir
  const lineColor    = layerStyles.fillColor              // çizgi rengi
  const outlineColor = layerStyles.strokeColor            // polygon kenar rengi
  const fillOpacity  = layerStyles.opacity * 0.3          // DataLayer: fill-opacity = opacity * 0.3
  const lineW        = layerStyles.lineWidth               // çizgi kalınlığı
  const strokeW      = layerStyles.strokeWidth             // polygon kenar kalınlığı

  return (
    <>
      {/* Measurement tooltip — cursor'un 16px sağ-üstünde */}
      {measurement && cursorPos && (
        <div
          style={{
            position: 'absolute',
            left: cursorPos.x + 16,
            top:  cursorPos.y - 28,
            pointerEvents: 'none',
            zIndex: 10,
            background: layerStyles.fillColor,
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            padding: '3px 7px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {measurement}
        </div>
      )}

      <Source id="draw-source" type="geojson" data={drawGeoJSON}>

        {/* Polygon fill — DataLayer ile aynı formül */}
        <Layer
          id="draw-fill"
          type="fill"
          filter={['==', '$type', 'Polygon']}
          paint={{
            'fill-color': lineColor,
            'fill-color-transition': { duration: 0 },
            'fill-opacity': fillOpacity,
            'fill-opacity-transition': { duration: 0 },
          }}
        />

        {/* Polygon outline */}
        <Layer
          id="draw-polygon-outline"
          type="line"
          filter={['==', '$type', 'Polygon']}
          layout={{ 'line-join': 'round', 'line-cap': 'round' }}
          paint={{
            'line-color': outlineColor,
            'line-color-transition': { duration: 0 },
            'line-width': strokeW,
            'line-width-transition': { duration: 0 },
            'line-opacity': layerStyles.opacity,
            'line-opacity-transition': { duration: 0 },
          }}
        />

        {/* Line */}
        <Layer
          id="draw-line"
          type="line"
          filter={['==', '$type', 'LineString']}
          layout={{ 'line-join': 'round', 'line-cap': 'round' }}
          paint={{
            'line-color': lineColor,
            'line-color-transition': { duration: 0 },
            'line-width': lineW,
            'line-width-transition': { duration: 0 },
            'line-opacity': layerStyles.opacity,
            'line-opacity-transition': { duration: 0 },
          }}
        />

        {/* Vertex noktaları — tüm transition'lar kapalı */}
        <Layer
          id="draw-point"
          type="circle"
          filter={['==', '$type', 'Point']}
          paint={{
            'circle-radius': [
              'case',
              ['==', ['get', 'type'], 'point'], layerStyles.width,
              ['==', ['get', 'active'], 1], 7,
              5,
            ],
            'circle-radius-transition': { duration: 0 },
            'circle-color': VERTEX_BG,
            'circle-color-transition': { duration: 0 },
            'circle-stroke-width': strokeW,
            'circle-stroke-width-transition': { duration: 0 },
            'circle-stroke-color': outlineColor,
            'circle-stroke-color-transition': { duration: 0 },
            'circle-opacity': layerStyles.opacity,
            'circle-opacity-transition': { duration: 0 },
            'circle-pitch-alignment': 'map',
          }}
        />
      </Source>
    </>
  )
}
