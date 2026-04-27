import * as turf from '@turf/turf'
import type { FeatureCollection, LineString, Polygon } from 'geojson'
import type maplibregl from 'maplibre-gl'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useMap, Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { LayerProps } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

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

interface MarkerListProps {
  points: [number, number][]
  isDrawingDistance: boolean
  onMarkerDrag: (idx: number, e: { lngLat: { lng: number; lat: number } }) => void
  onFirstPointClick: (e: { originalEvent?: Event } | Event) => void
  onPointerDownCapture: () => void
  onPointerUpCapture: () => void
}

const MarkerList = memo(function MarkerList({
  points,
  isDrawingDistance,
  onMarkerDrag,
  onFirstPointClick,
  onPointerDownCapture,
  onPointerUpCapture,
}: MarkerListProps) {
  return (
    <>
      {points.map((pt, idx) => (
        <Marker
          key={idx}
          longitude={pt[0]}
          latitude={pt[1]}
          draggable={true}
          onDrag={(e) => onMarkerDrag(idx, e)}
          onClick={idx === 0 ? onFirstPointClick : undefined}
          style={{ transition: 'none' }}
        >
          <div
            className={`box-content rounded-full cursor-move ${idx === 0 && isDrawingDistance && points.length >= 3
              ? 'ring-2 ring-emerald-500 ring-offset-2'
              : ''
            }`}
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: '#1a1a1a',
              border: '2px solid #ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
              transition: 'none',
            }}
            title={idx === 0 && isDrawingDistance ? 'Kapatmak için tıkla' : ''}
            onPointerDown={onPointerDownCapture}
            onPointerUp={onPointerUpCapture}
          />
        </Marker>
      ))}
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

    if (isDrawingDistance) {
      mapInstance.getCanvas().style.cursor = 'crosshair'
    }

    return () => {
      mapInstance.off('click', handleClickSafe)
      mapInstance.off('dblclick', handleDblClick)
      document.removeEventListener('keydown', handleKeyDown)
      mapInstance.getCanvas().style.cursor = ''
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

  if (!isActive) return null
  if (distancePoints.length === 0 && !isDrawingDistance) return null

  const lineLayer: LayerProps = {
    id: 'measure-line',
    type: 'line',
    paint: {
      'line-color': '#475569',
      'line-width': 2,
      'line-opacity': 0.75,
    },
  }

  const fillLayer: LayerProps = {
    id: 'measure-fill',
    type: 'fill',
    paint: {
      'fill-color': '#9ca3af',
      'fill-opacity': 0.0,
    },
  }

  const ghostLineLayer: LayerProps = {
    id: 'measure-ghost-line',
    type: 'line',
    paint: {
      'line-color': '#94a3b8',
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': 0.6,
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
        onMarkerDrag={handleMarkerDrag}
        onFirstPointClick={handleFirstPointClick}
        onPointerDownCapture={handleMarkerPointerDown}
        onPointerUpCapture={handleMarkerPointerUp}
      />
    </>
  )
}
