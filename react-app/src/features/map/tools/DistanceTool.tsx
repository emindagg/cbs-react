import * as turf from '@turf/turf'
import type { FeatureCollection, LineString, Polygon } from 'geojson'
import type maplibregl from 'maplibre-gl'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useMap, Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { LayerProps } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

import { DRAG_CURSOR, DRAW_CURSOR } from './cursors'
import { MeasurementPanel } from './DistanceTool.display'
import type { MeasurementPanelHandle } from './DistanceTool.display'
import { useDistanceHandlers } from './DistanceTool.handlers'
import {
  calculateMeasurement,
  calculatePerimeter,
  formatArea,
  formatDistance,
} from './DistanceTool.utils'

const GHOST_SOURCE_ID = 'measure-ghost-source'
const EMPTY_GHOST_DATA: FeatureCollection<LineString> = { type: 'FeatureCollection', features: [] }
const NORMAL_VERTEX_DIAMETER_PX = 11
const SELECTED_VERTEX_DIAMETER_PX = 13
const MIDPOINT_DIAMETER_PX = 7
const DISTANCE_TOOL_COLORS = {
  line: '#211F1F',
  lineGhost: '#4b4646',
  fill: '#2b2828',
  vertex: '#211F1F',
  vertexSelected: '#141212',
  vertexBorder: '#d6d3d1',
  vertexSelectedBorder: '#60a5fa',
  midpoint: '#3a3535',
  midpointBorder: '#cfc9c9',
} as const

interface MarkerListProps {
  points: [number, number][]
  isDrawingDistance: boolean
  isClosed: boolean
  onMarkerDrag: (idx: number, e: { lngLat: { lng: number; lat: number } }) => void
  onFirstPointClick: (e: { originalEvent?: Event } | Event) => void
  onLastPointClick: (e: { originalEvent?: Event } | Event) => void
  onPointerDownCapture: () => void
  onPointerUpCapture: () => void
}

interface MidpointListProps {
  points: [number, number][]
  onMidpointClick: (insertIndex: number, e: { originalEvent?: Event } | Event) => void
  onMidpointDragStart: (insertIndex: number) => void
  onMidpointDrag: (insertIndex: number, e: { lngLat: { lng: number; lat: number } }) => void
  onMidpointDragEnd: () => void
}

const MidpointList = memo(function MidpointList({
  points,
  onMidpointClick,
  onMidpointDragStart,
  onMidpointDrag,
  onMidpointDragEnd,
}: MidpointListProps) {
  const midpointCoords = useMemo(() => {
    if (points.length < 2) return []

    return points.slice(0, -1).map((startPoint, idx) => {
      const endPoint = points[idx + 1]
      return [
        (startPoint[0] + endPoint[0]) / 2,
        (startPoint[1] + endPoint[1]) / 2,
      ] as [number, number]
    })
  }, [points])

  return (
    <>
      {midpointCoords.map((pt, idx) => (
        <Marker
          key={`midpoint-${idx}`}
          longitude={pt[0]}
          latitude={pt[1]}
          draggable={true}
          onClick={(e) => onMidpointClick(idx + 1, e)}
          onDragStart={() => onMidpointDragStart(idx + 1)}
          onDrag={(e) => onMidpointDrag(idx + 1, e)}
          onDragEnd={onMidpointDragEnd}
          style={{ transition: 'none' }}
        >
          <div
            className="box-content rounded-full cursor-default"
            style={{
              width: `${MIDPOINT_DIAMETER_PX}px`,
              height: `${MIDPOINT_DIAMETER_PX}px`,
              backgroundColor: DISTANCE_TOOL_COLORS.midpoint,
              border: `1px solid ${DISTANCE_TOOL_COLORS.midpointBorder}`,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
              transition: 'none',
            }}
          />
        </Marker>
      ))}
    </>
  )
})

const MarkerList = memo(function MarkerList({
  points,
  isDrawingDistance,
  isClosed,
  onMarkerDrag,
  onFirstPointClick,
  onLastPointClick,
  onPointerDownCapture,
  onPointerUpCapture,
}: MarkerListProps) {
  return (
    <>
      {points.map((pt, idx) => {
        const isSelectedVertex = idx === 0 && isDrawingDistance && points.length >= 3
        const vertexSizePx = isSelectedVertex ? SELECTED_VERTEX_DIAMETER_PX : NORMAL_VERTEX_DIAMETER_PX

        return (
          <Marker
            key={idx}
            longitude={pt[0]}
            latitude={pt[1]}
            draggable={true}
            onDrag={(e) => onMarkerDrag(idx, e)}
            onClick={
              idx === 0
                ? onFirstPointClick
                : (!isDrawingDistance && !isClosed && idx === points.length - 1 ? onLastPointClick : undefined)
            }
            style={{ transition: 'none' }}
          >
            <div
              className={`box-content rounded-full cursor-default ${isSelectedVertex
                ? 'ring-2 ring-emerald-500 ring-offset-2'
                : ''
              }`}
              style={{
                width: `${vertexSizePx}px`,
                height: `${vertexSizePx}px`,
                backgroundColor: isSelectedVertex
                  ? DISTANCE_TOOL_COLORS.vertexSelected
                  : DISTANCE_TOOL_COLORS.vertex,
                border: `2px solid ${idx === 0
                  ? (isSelectedVertex
                    ? DISTANCE_TOOL_COLORS.vertexSelectedBorder
                    : DISTANCE_TOOL_COLORS.vertexBorder)
                  : '#ffffff'}`,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                transition: 'none',
              }}
              title={idx === 0 && isDrawingDistance ? 'Kapatmak için tıkla' : ''}
              onPointerDown={onPointerDownCapture}
              onPointerUp={onPointerUpCapture}
            />
          </Marker>
        )
      })}
    </>
  )
})

export default function DistanceTool() {
  const { current: map } = useMap()
  const {
    activeTool,
    distancePoints,
    isDrawingDistance,
    resetDistance,
    setDistancePoints,
    setIsDrawingDistance,
    undoDistance,
  } = useToolStore()

  const isActive = activeTool === 'measure-distance'
  const isDraggingMarker = useRef(false)
  const ghostPointRef = useRef<[number, number] | null>(null)
  const rafRef = useRef<number | null>(null)
  const panelRef = useRef<MeasurementPanelHandle>(null)

  const isClosed = useMemo(() => {
    if (distancePoints.length < 3) return false
    const first = distancePoints[0]
    const last = distancePoints[distancePoints.length - 1]
    return first[0] === last[0] && first[1] === last[1]
  }, [distancePoints])

  const updateGhostSource = useCallback(() => {
    if (!map) return
    const mapInstance = map as unknown as maplibregl.Map
    const source = mapInstance.getSource(GHOST_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    if (!source) return

    const ghost = ghostPointRef.current
    if (!isDrawingDistance || distancePoints.length === 0 || !ghost) {
      source.setData(EMPTY_GHOST_DATA)
      return
    }
    const lastPoint = distancePoints[distancePoints.length - 1]
    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [lastPoint, ghost] },
        properties: {},
      }],
    })
  }, [map, isDrawingDistance, distancePoints])

  const resetGhost = useCallback(() => {
    ghostPointRef.current = null
    updateGhostSource()
    if (distancePoints.length === 0) {
      panelRef.current?.updateLive(0, 0)
    }
  }, [updateGhostSource, distancePoints.length])

  const {
    handleClick,
    handleDblClick,
    handleFirstPointClick,
    handleMarkerDrag,
    handleKeyDown,
  } = useDistanceHandlers({
    isActive,
    isDrawingDistance,
    distancePoints,
    isClosed,
    onGhostReset: resetGhost,
  })

  const handleClickSafe = useCallback((e: maplibregl.MapMouseEvent) => {
    if (isDraggingMarker.current) return
    handleClick(e)
  }, [handleClick])

  // Accumulated distance between confirmed points (not incl. ghost)
  const staticDistance = useMemo(() => {
    if (isClosed || distancePoints.length < 2) return 0
    return turf.length(turf.lineString(distancePoints), { units: 'kilometers' })
  }, [distancePoints, isClosed])

  // Mouse move: rAF-throttled, imperative ghost + panel update (no React re-render)
  useEffect(() => {
    if (!map || !isActive) return
    const mapInstance = map as unknown as maplibregl.Map

    const flush = () => {
      rafRef.current = null
      updateGhostSource()
      const ghost = ghostPointRef.current
      if (!ghost || distancePoints.length === 0) return
      const lastPoint = distancePoints[distancePoints.length - 1]
      const tempSegment = turf.distance(lastPoint, ghost, { units: 'kilometers' })
      const tempTotal = staticDistance + tempSegment
      panelRef.current?.updateLive(tempTotal, tempSegment)
    }

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawingDistance) return
      ghostPointRef.current = [e.lngLat.lng, e.lngLat.lat]
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(flush)
    }

    mapInstance.on('mousemove', handleMouseMove)
    return () => {
      mapInstance.off('mousemove', handleMouseMove)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [map, isActive, isDrawingDistance, distancePoints, staticDistance, updateGhostSource])

  // Click / dblclick / keydown listeners
  useEffect(() => {
    if (!map || !isActive) return
    const mapInstance = map as unknown as maplibregl.Map

    mapInstance.on('click', handleClickSafe)
    mapInstance.on('dblclick', handleDblClick)
    document.addEventListener('keydown', handleKeyDown)

    // Canvas cursor
    mapInstance.getCanvas().style.cursor = DRAW_CURSOR

    // Override cursor on HTML overlays (Markers, controls, etc.) inside the map
    const container = mapInstance.getContainer()
    container.classList.add('map-draw-active')
    const styleEl = document.createElement('style')
    styleEl.dataset.owner = 'distance-tool'
    styleEl.textContent = [
      `.map-draw-active, .map-draw-active * { cursor: ${DRAW_CURSOR} !important; }`,
      `.map-draw-active .maplibregl-marker:hover * { cursor: ${DRAG_CURSOR} !important; }`,
    ].join('\n')
    document.head.appendChild(styleEl)

    return () => {
      mapInstance.off('click', handleClickSafe)
      mapInstance.off('dblclick', handleDblClick)
      document.removeEventListener('keydown', handleKeyDown)
      mapInstance.getCanvas().style.cursor = ''
      container.classList.remove('map-draw-active')
      styleEl.remove()
    }
  }, [map, isActive, handleClickSafe, handleDblClick, handleKeyDown, isDrawingDistance])

  // Reset ghost when drawing stops or points change
  useEffect(() => {
    if (!isDrawingDistance) {
      ghostPointRef.current = null
      updateGhostSource()
      if (distancePoints.length === 0) {
        panelRef.current?.updateLive(0, 0)
      }
    }
  }, [isDrawingDistance, distancePoints.length, updateGhostSource])

  const mainGeoJSON = useMemo((): FeatureCollection<LineString | Polygon> => {
    if (distancePoints.length < 2) return { type: 'FeatureCollection', features: [] }

    if (isClosed) {
      return {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [distancePoints as [number, number][]],
          },
          properties: {},
        }],
      }
    }

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: distancePoints as [number, number][],
        },
        properties: {},
      }],
    }
  }, [distancePoints, isClosed])

  const measurementValue = useMemo(
    () => calculateMeasurement(distancePoints, isClosed),
    [distancePoints, isClosed],
  )

  const perimeterValue = useMemo(
    () => calculatePerimeter(distancePoints, isClosed),
    [distancePoints, isClosed],
  )

  const handleMarkerPointerDown = useCallback(() => {
    isDraggingMarker.current = true
  }, [])

  const handleMarkerPointerUp = useCallback(() => {
    setTimeout(() => { isDraggingMarker.current = false }, 50)
  }, [])

  const handleMidpointDragStart = useCallback((insertIndex: number) => {
    isDraggingMarker.current = true
    const prevPoints = useToolStore.getState().distancePoints
    if (insertIndex < 1 || insertIndex > prevPoints.length - 1) return
    const prevPoint = prevPoints[insertIndex - 1]
    const nextPoint = prevPoints[insertIndex]
    const midpoint: [number, number] = [
      (prevPoint[0] + nextPoint[0]) / 2,
      (prevPoint[1] + nextPoint[1]) / 2,
    ]
    const updated = [...prevPoints]
    updated.splice(insertIndex, 0, midpoint)
    setDistancePoints(updated)
  }, [setDistancePoints])

  const handleMidpointDrag = useCallback((insertIndex: number, e: { lngLat: { lng: number; lat: number } }) => {
    const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]
    const prevPoints = useToolStore.getState().distancePoints
    if (insertIndex < 1 || insertIndex > prevPoints.length - 2) return
    const updated = [...prevPoints]
    updated[insertIndex] = newPoint
    setDistancePoints(updated)
  }, [setDistancePoints])

  const handleMidpointDragEnd = useCallback(() => {
    setTimeout(() => { isDraggingMarker.current = false }, 50)
  }, [])

  const handleMidpointClick = useCallback((insertIndex: number, e: { originalEvent?: Event } | Event) => {
    const hasOriginalEvent = (evt: unknown): evt is { originalEvent: Event } =>
      typeof evt === 'object' && evt !== null && 'originalEvent' in evt

    if (hasOriginalEvent(e) && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
      e.originalEvent.stopPropagation()
    } else if (e && typeof (e as Event).stopPropagation === 'function') {
      (e as Event).stopPropagation()
    }

    const prevPoints = useToolStore.getState().distancePoints
    if (insertIndex < 1 || insertIndex > prevPoints.length - 1) return
    const prevPoint = prevPoints[insertIndex - 1]
    const nextPoint = prevPoints[insertIndex]
    const midpoint: [number, number] = [
      (prevPoint[0] + nextPoint[0]) / 2,
      (prevPoint[1] + nextPoint[1]) / 2,
    ]
    const updated = [...prevPoints]
    updated.splice(insertIndex, 0, midpoint)
    setDistancePoints(updated)
  }, [setDistancePoints])

  const handleLastPointClick = useCallback((e: { originalEvent?: Event } | Event) => {
    const hasOriginalEvent = (evt: unknown): evt is { originalEvent: Event } =>
      typeof evt === 'object' && evt !== null && 'originalEvent' in evt

    if (hasOriginalEvent(e) && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
      e.originalEvent.stopPropagation()
    } else if (e && typeof (e as Event).stopPropagation === 'function') {
      (e as Event).stopPropagation()
    }

    if (!isClosed && !isDrawingDistance && distancePoints.length > 0) {
      setIsDrawingDistance(true)
    }
  }, [distancePoints.length, isClosed, isDrawingDistance, setIsDrawingDistance])

  if (!isActive) return null
  if (distancePoints.length === 0 && !isDrawingDistance) return null

  const lineLayer: LayerProps = {
    id: 'measure-line',
    type: 'line',
    paint: {
      'line-color': DISTANCE_TOOL_COLORS.line,
      'line-width': 2,
      'line-opacity': 0.72,
    },
  }

  const fillLayer: LayerProps = {
    id: 'measure-fill',
    type: 'fill',
    paint: {
      'fill-color': DISTANCE_TOOL_COLORS.fill,
      'fill-opacity': 0.08,
    },
  }

  const ghostLineLayer: LayerProps = {
    id: 'measure-ghost-line',
    type: 'line',
    paint: {
      'line-color': DISTANCE_TOOL_COLORS.lineGhost,
      'line-width': 2,
      'line-opacity': 0.68,
    },
  }

  return (
    <>
      <MeasurementPanel
        ref={panelRef}
        isClosed={isClosed}
        perimeterValue={perimeterValue}
        measurementValue={measurementValue}
        isDrawingDistance={isDrawingDistance}
        formatDistance={formatDistance}
        formatArea={formatArea}
        onReset={resetDistance}
        onUndo={undoDistance}
        canUndo={distancePoints.length > 0}
      />

      <Source id="measure-source" type="geojson" data={mainGeoJSON}>
        <Layer {...lineLayer} />
        {isClosed && <Layer {...fillLayer} />}
      </Source>

      {!isClosed && (
        <Source id={GHOST_SOURCE_ID} type="geojson" data={EMPTY_GHOST_DATA}>
          <Layer {...ghostLineLayer} />
        </Source>
      )}

      <MarkerList
        points={distancePoints}
        isDrawingDistance={isDrawingDistance}
        isClosed={isClosed}
        onMarkerDrag={handleMarkerDrag}
        onFirstPointClick={handleFirstPointClick}
        onLastPointClick={handleLastPointClick}
        onPointerDownCapture={handleMarkerPointerDown}
        onPointerUpCapture={handleMarkerPointerUp}
      />
      <MidpointList
        points={distancePoints}
        onMidpointClick={handleMidpointClick}
        onMidpointDragStart={handleMidpointDragStart}
        onMidpointDrag={handleMidpointDrag}
        onMidpointDragEnd={handleMidpointDragEnd}
      />
    </>
  )
}
