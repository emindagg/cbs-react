import type { FeatureCollection, LineString, Polygon } from 'geojson'
import type maplibregl from 'maplibre-gl'
import { useEffect, useMemo } from 'react'
import { useMap, Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { LayerProps } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

import { MeasurementPanel } from './DistanceTool.display'
import { useDistanceHandlers } from './DistanceTool.handlers'
import {
  calculateMeasurement,
  calculatePerimeter,
  calculateTempSegmentDistance,
  calculateTempDistance,
  formatArea,
  formatDistance,
} from './DistanceTool.utils'

export default function DistanceTool() {
  const { current: map } = useMap()
  const {
    activeTool,
    distancePoints,
    distanceGhostPoint,
    isDrawingDistance,
    resetDistance,
  } = useToolStore()

  const isActive = activeTool === 'measure-distance'

  // Check if shape is closed
  const isClosed = useMemo(() => {
    if (distancePoints.length < 3) return false
    const first = distancePoints[0]
    const last = distancePoints[distancePoints.length - 1]
    return first[0] === last[0] && first[1] === last[1]
  }, [distancePoints])

  // Event handlers
  const {
    handleMouseMove,
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
  })

  // Attach/Detach Listeners
  useEffect(() => {
    if (!map || !isActive) return

    const mapInstance = map as unknown as maplibregl.Map

    mapInstance.on('mousemove', handleMouseMove)
    mapInstance.on('click', handleClick)
    mapInstance.on('dblclick', handleDblClick)
    document.addEventListener('keydown', handleKeyDown)

    // Set cursor
    if (isDrawingDistance) {
      mapInstance.getCanvas().style.cursor = 'crosshair'
    }

    return () => {
      mapInstance.off('mousemove', handleMouseMove)
      mapInstance.off('click', handleClick)
      mapInstance.off('dblclick', handleDblClick)
      document.removeEventListener('keydown', handleKeyDown)
      mapInstance.getCanvas().style.cursor = ''
    }
  }, [map, isActive, handleMouseMove, handleClick, handleDblClick, handleKeyDown, isDrawingDistance])


  // --- GeoJSON Generation ---

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

  const ghostGeoJSON = useMemo((): FeatureCollection<LineString> => {
    if (!isDrawingDistance || distancePoints.length === 0 || !distanceGhostPoint) {
      return { type: 'FeatureCollection', features: [] }
    }

    const lastPoint = distancePoints[distancePoints.length - 1] as [number, number]
    const ghost = distanceGhostPoint as [number, number]

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [lastPoint, ghost],
        },
        properties: {},
      }],
    }
  }, [distancePoints, distanceGhostPoint, isDrawingDistance])

  // Calculations
  const measurementValue = useMemo(
    () => calculateMeasurement(distancePoints, isClosed),
    [distancePoints, isClosed],
  )

  const perimeterValue = useMemo(
    () => calculatePerimeter(distancePoints, isClosed),
    [distancePoints, isClosed],
  )

  const tempTotalDistance = useMemo(
    () => calculateTempDistance(distancePoints, distanceGhostPoint),
    [distancePoints, distanceGhostPoint],
  )

  const tempSegmentDistance = useMemo(
    () => calculateTempSegmentDistance(distancePoints, distanceGhostPoint),
    [distancePoints, distanceGhostPoint],
  )


  // STRICT VISIBILITY & CLEAN START
  // 1. If not active -> Null
  // 2. If active but no points and not drawing -> Null (Don't show empty 0.00m box, let user just see crosshair)
  if (!isActive) return null
  if (distancePoints.length === 0 && !isDrawingDistance) return null

  // Layer Styles
  const lineLayer: LayerProps = {
    id: 'measure-line',
    type: 'line',
    paint: {
      'line-color': '#111827', // Black
      'line-width': 3, // Thicker
    },
  }

  const fillLayer: LayerProps = {
    id: 'measure-fill',
    type: 'fill',
    paint: {
      'fill-color': '#9ca3af',
      'fill-opacity': 0.0, // Transparent
    },
  }

  const ghostLineLayer: LayerProps = {
    id: 'measure-ghost-line',
    type: 'line',
    paint: {
      'line-color': '#111827',
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': 0.6,
    },
  }

  return (
    <>
      <MeasurementPanel
        isClosed={isClosed}
        perimeterValue={perimeterValue}
        measurementValue={measurementValue}
        tempTotalDistance={tempTotalDistance}
        tempSegmentDistance={tempSegmentDistance}
        isDrawingDistance={isDrawingDistance}
        formatDistance={formatDistance}
        formatArea={formatArea}
        onReset={resetDistance}
      />

      {/* Main Geometry */}
      <Source id="measure-source" type="geojson" data={mainGeoJSON}>
        <Layer {...lineLayer} />
        {isClosed && <Layer {...fillLayer} />}
      </Source>

      {/* Ghost Geometry */}
      {!isClosed && (
        <Source id="measure-ghost-source" type="geojson" data={ghostGeoJSON}>
          <Layer {...ghostLineLayer} />
        </Source>
      )}

      {/* Markers - Legacy OneSoil Style */}
      {distancePoints.map((pt, idx) => (
        <Marker
          key={idx}
          longitude={pt[0]}
          latitude={pt[1]}
          draggable={true}
          onDrag={(e) => handleMarkerDrag(idx, e)}
          onClick={idx === 0 ? handleFirstPointClick : undefined}
          style={{ transition: 'none' }}
        >
          <div
            className={`box-content rounded-full cursor-move ${idx === 0 && isDrawingDistance && distancePoints.length >= 3
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
          />
        </Marker>
      ))}
    </>
  )
}
