import * as turf from '@turf/turf'
import type { FeatureCollection, LineString, Point, Polygon } from 'geojson'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'

import { DRAG_CURSOR, DRAW_CURSOR } from '@/features/map/tools/cursors'

import { useDataManagementStore } from '../store/useDataManagementStore'

// Vertex bg rengi — Monokrom Editoryal: node.fill
const VERTEX_BG = '#fffdf9'
const CUSTOM_CURSOR = DRAW_CURSOR

const getMidpoint = (a: [number, number], b: [number, number]): [number, number] => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
]

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
    undoDraw,
    redoDraw,
  } = useDataManagementStore()

  const isDraggingRef = useRef(false)
  const draggingIndexRef = useRef<number | null>(null)
  const drawPointsRef = useRef<[number, number][]>([])
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    drawPointsRef.current = drawPoints
  }, [drawPoints])

  useEffect(() => {
    if (drawMode === 'none') {
      isDraggingRef.current = false
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
    if (map) map.getCanvas().style.cursor = CUSTOM_CURSOR
  }, [isDrawing, map, setDrawGhostPoint, updateDrawPoint])

  const handleClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isDrawing) return
    const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat]
    if (drawMode === 'point') {
      setDrawPoints([lngLat])
      setIsDrawing(false)
      setDrawGhostPoint(null)
      if (map) map.getCanvas().style.cursor = CUSTOM_CURSOR
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

  const endVertexDrag = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    draggingIndexRef.current = null
    setDraggingIndex(null)
    map?.dragPan?.enable()
    if (map) map.getCanvas().style.cursor = CUSTOM_CURSOR
  }, [map])

  const handleMouseUp = useCallback(() => {
    endVertexDrag()
  }, [endVertexDrag])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isUndoShortcut = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z'
    const isRedoShortcut =
      (e.ctrlKey || e.metaKey) &&
      (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))

    if (isUndoShortcut) {
      e.preventDefault()
      undoDraw()
      return
    }

    if (isRedoShortcut) {
      e.preventDefault()
      redoDraw()
      return
    }

    if (e.key === 'Escape') {
      if (isDraggingRef.current) endVertexDrag()
      else {
        resetDraw()
        if (map) map.getCanvas().style.cursor = ''
      }
    }
  }, [resetDraw, map, undoDraw, redoDraw, endVertexDrag])

  useEffect(() => {
    if (!map || drawMode === 'none') return
    map.on('mousemove', handleMouseMove)
    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)
    map.on('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)
    if (isDrawing) map.getCanvas().style.cursor = CUSTOM_CURSOR
    return () => {
      map.off('mousemove', handleMouseMove)
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
      map.off('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
      map.getCanvas().style.cursor = ''
    }
  }, [map, drawMode, isDrawing, handleMouseMove, handleClick, handleDblClick, handleMouseUp, handleKeyDown])

  // Vertex düzenleme — sadece edit modunda (fare + dokunma)
  useEffect(() => {
    if (!map || drawMode === 'none' || isDrawing) return
    const canvas = map.getCanvas()

    const beginVertexInteraction = (
      lngLat: { lng: number; lat: number },
      properties: GeoJSON.GeoJsonProperties | null | undefined,
    ): boolean => {
      const insertIndex = properties && typeof properties === 'object' && 'insertIndex' in properties
        ? (properties as { insertIndex?: unknown }).insertIndex
        : undefined
      const vertexIndex = properties && typeof properties === 'object' && 'vertexIndex' in properties
        ? (properties as { vertexIndex?: unknown }).vertexIndex
        : undefined
      let nextDragIndex: number | null = null

      if (insertIndex !== undefined && insertIndex !== null) {
        nextDragIndex = Number(insertIndex)
        const nextPoints = [...drawPointsRef.current]
        nextPoints.splice(nextDragIndex, 0, [lngLat.lng, lngLat.lat])
        drawPointsRef.current = nextPoints
        setDrawPoints(nextPoints)
      } else if (vertexIndex !== undefined && vertexIndex !== null) {
        nextDragIndex = Number(vertexIndex)
      }

      if (nextDragIndex === null) return false
      draggingIndexRef.current = nextDragIndex
      isDraggingRef.current = true
      setDraggingIndex(nextDragIndex)
      map.dragPan?.disable()
      canvas.style.cursor = CUSTOM_CURSOR
      return true
    }

    const onEnter = () => { if (!isDraggingRef.current) canvas.style.cursor = DRAG_CURSOR }
    const onLeave = () => { if (!isDraggingRef.current) canvas.style.cursor = CUSTOM_CURSOR }
    const onDown = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features?.length) return
      if (!beginVertexInteraction(e.lngLat, e.features[0].properties)) return
      e.preventDefault()
    }

    const touchOpts: AddEventListenerOptions = { passive: false }
    const onTouchStart: EventListener = (e) => {
      if (!(e instanceof TouchEvent) || e.touches.length !== 1) return
      const t = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      const x = t.clientX - rect.left
      const y = t.clientY - rect.top
      const features = map.queryRenderedFeatures([x, y], { layers: ['draw-point'] })
      if (!features.length) return
      const projected = map.unproject([x, y])
      if (!beginVertexInteraction({ lng: projected.lng, lat: projected.lat }, features[0].properties)) return
      e.preventDefault()
    }
    const onTouchMove: EventListener = (e) => {
      if (!(e instanceof TouchEvent) || e.touches.length !== 1) return
      if (!isDraggingRef.current || draggingIndexRef.current === null) return
      e.preventDefault()
      const t = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      const ll = map.unproject([t.clientX - rect.left, t.clientY - rect.top])
      updateDrawPoint(draggingIndexRef.current, [ll.lng, ll.lat])
      setCursorPos({ x: t.clientX - rect.left, y: t.clientY - rect.top })
    }
    const onTouchEnd = () => { endVertexDrag() }

    map.on('mouseenter', 'draw-point', onEnter)
    map.on('mouseleave', 'draw-point', onLeave)
    map.on('mousedown', 'draw-point', onDown)
    canvas.addEventListener('touchstart', onTouchStart, touchOpts)
    canvas.addEventListener('touchmove', onTouchMove, touchOpts)
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('touchcancel', onTouchEnd)

    return () => {
      map.off('mouseenter', 'draw-point', onEnter)
      map.off('mouseleave', 'draw-point', onLeave)
      map.off('mousedown', 'draw-point', onDown)
      canvas.removeEventListener('touchstart', onTouchStart, touchOpts)
      canvas.removeEventListener('touchmove', onTouchMove, touchOpts)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
      if (isDraggingRef.current) {
        map.dragPan?.enable()
        isDraggingRef.current = false
        draggingIndexRef.current = null
        setDraggingIndex(null)
      }
    }
  }, [map, drawMode, isDrawing, setDrawPoints, updateDrawPoint, setCursorPos, endVertexDrag])

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

      if (!isDrawing && drawPoints.length > 1) {
        const segmentCount = drawMode === 'polygon' && drawPoints.length > 2
          ? drawPoints.length
          : drawPoints.length - 1

        for (let idx = 0; idx < segmentCount; idx++) {
          const current = drawPoints[idx]
          const next = drawPoints[(idx + 1) % drawPoints.length]
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: getMidpoint(current, next) },
            properties: { type: 'midpoint', insertIndex: idx + 1 },
          })
        }
      }
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
      const km = turf.length(line, { units: 'kilometers' })
      return km >= 1
        ? `${km.toFixed(2)} km`
        : `${(km * 1000).toFixed(0)} m`
    }

    if (drawMode === 'polygon' && activePoints.length > 2) {
      const poly = turf.polygon([[...activePoints, activePoints[0]]])
      const km2 = turf.area(poly) / 1_000_000
      return km2 >= 1
        ? `${km2.toFixed(2)} km²`
        : `${(km2 * 1_000_000).toFixed(0)} m²`
    }

    return null
  }, [drawMode, drawPoints, drawGhostPoint, isDrawing])

  if (drawMode === 'none') return null

  // DataLayer ile birebir aynı formüller — kaydetme sonrası görünüm eşleşir
  const lineColor = layerStyles.fillColor              // çizgi rengi
  const outlineColor = layerStyles.strokeColor            // polygon kenar rengi
  const fillOpacity = layerStyles.opacity                // dolgu şeffaflığı
  const strokeOpacity = layerStyles.strokeOpacity         // kenar şeffaflığı
  const lineW = layerStyles.lineWidth               // çizgi kalınlığı
  const strokeW = layerStyles.strokeWidth             // polygon kenar kalınlığı

  return (
    <>
      {/* Measurement tooltip — cursor'un 16px sağ-üstünde */}
      {measurement && cursorPos && (
        <div
          style={{
            position: 'absolute',
            left: cursorPos.x + 16,
            top: cursorPos.y - 28,
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
            'line-opacity': strokeOpacity,
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
            'line-opacity': strokeOpacity,
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
              ['==', ['get', 'type'], 'midpoint'], 3.5,
              ['==', ['get', 'active'], 1], 7,
              5,
            ],
            'circle-radius-transition': { duration: 0 },
            'circle-color': [
              'case',
              ['==', ['get', 'type'], 'midpoint'], '#ffffff',
              VERTEX_BG,
            ],
            'circle-color-transition': { duration: 0 },
            'circle-stroke-width': [
              'case',
              ['==', ['get', 'type'], 'midpoint'], 1.5,
              strokeW,
            ],
            'circle-stroke-width-transition': { duration: 0 },
            'circle-stroke-color': [
              'case',
              ['==', ['get', 'type'], 'midpoint'], lineColor,
              outlineColor,
            ],
            'circle-stroke-color-transition': { duration: 0 },
            'circle-opacity': [
              'case',
              ['==', ['get', 'type'], 'midpoint'], 0.9,
              layerStyles.opacity,
            ],
            'circle-opacity-transition': { duration: 0 },
            'circle-pitch-alignment': 'map',
          }}
        />
      </Source>
    </>
  )
}
