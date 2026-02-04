import * as turf from '@turf/turf'
import type { FeatureCollection, LineString, Polygon } from 'geojson'
import { useEffect, useCallback, useMemo } from 'react'
import { useMap, Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { LayerProps } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

export default function DistanceTool() {
  const { current: map } = useMap()
  const {
    activeTool,
    distancePoints,
    distanceGhostPoint,
    isDrawingDistance,
    setDistancePoints,
    setDistanceGhostPoint,
    setIsDrawingDistance,
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

  // --- Interaction Logic ---

  const handleMouseMove = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isActive || !isDrawingDistance) return
    setDistanceGhostPoint([e.lngLat.lng, e.lngLat.lat])
    if (map) map.getCanvas().style.cursor = 'crosshair'
  }, [isActive, isDrawingDistance, map, setDistanceGhostPoint])

  const handleClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isActive) return

    // Click on map - Add point
    if (!isDrawingDistance) {
      resetDistance()
      setIsDrawingDistance(true)
      setDistancePoints([[e.lngLat.lng, e.lngLat.lat]])
    } else {
      // Normal add point
      setDistancePoints([...distancePoints, [e.lngLat.lng, e.lngLat.lat]])
    }
  }, [isActive, isDrawingDistance, distancePoints, setDistancePoints, setIsDrawingDistance, resetDistance])

  const handleDblClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!isActive || !isDrawingDistance) return
    e.preventDefault()

    // Finish drawing
    setIsDrawingDistance(false)
    setDistanceGhostPoint(null)
    if (map) map.getCanvas().style.cursor = 'grab'
  }, [isActive, isDrawingDistance, map, setIsDrawingDistance, setDistanceGhostPoint])

  const handleFirstPointClick = (e: { originalEvent?: Event } | Event) => {
    // react-map-gl Marker onClick passes an object with originalEvent
    const hasOriginalEvent = (evt: unknown): evt is { originalEvent: Event; stopPropagation?: never } =>
      typeof evt === 'object' && evt !== null && 'originalEvent' in evt

    if (hasOriginalEvent(e) && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
      e.originalEvent.stopPropagation()
    } else if (e && typeof (e as Event).stopPropagation === 'function') {
      (e as Event).stopPropagation()
    }

    if (isActive && isDrawingDistance && distancePoints.length >= 3) {
      // Close loop
      setDistancePoints([...distancePoints, distancePoints[0]])
      setIsDrawingDistance(false)
      setDistanceGhostPoint(null)
      if (map) map.getCanvas().style.cursor = 'grab'
    }
  }

  const handleMarkerDrag = (idx: number, e: { lngLat: { lng: number; lat: number } }) => {
    const newPoints = [...distancePoints]
    const lng = e.lngLat.lng
    const lat = e.lngLat.lat

    newPoints[idx] = [lng, lat]

    // If closed, sync start/end points
    if (isClosed) {
      if (idx === 0) {
        newPoints[newPoints.length - 1] = [lng, lat]
      } else if (idx === newPoints.length - 1) {
        newPoints[0] = [lng, lat]
      }
    }

    setDistancePoints(newPoints)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive) return
    if (e.key === 'Escape') {
      if (isDrawingDistance || distancePoints.length > 0) {
        resetDistance()
        if (map) map.getCanvas().style.cursor = 'grab'
      } else {
        // Close the tool if hit ESC while empty
        useToolStore.setState({ activeTool: 'none' })
      }
    }
  }, [isActive, isDrawingDistance, distancePoints.length, map, resetDistance])

  // Attach/Detach Listeners
  useEffect(() => {
    if (!map || !isActive) return

    map.on('mousemove', handleMouseMove)
    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)
    document.addEventListener('keydown', handleKeyDown)

    if (isDrawingDistance) map.getCanvas().style.cursor = 'crosshair'

    return () => {
      map.off('mousemove', handleMouseMove)
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
      document.removeEventListener('keydown', handleKeyDown)
      if (map) map.getCanvas().style.cursor = ''
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
            coordinates: [distancePoints],
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
          coordinates: distancePoints,
        },
        properties: {},
      }],
    }
  }, [distancePoints, isClosed])

  const ghostGeoJSON = useMemo((): FeatureCollection<LineString> => {
    if (!isDrawingDistance || distancePoints.length === 0 || !distanceGhostPoint) {
      return { type: 'FeatureCollection', features: [] }
    }

    const lastPoint = distancePoints[distancePoints.length - 1]

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [lastPoint, distanceGhostPoint],
        },
        properties: {},
      }],
    }
  }, [distancePoints, distanceGhostPoint, isDrawingDistance])

  // --- Calculations ---

  const measurementValue = useMemo(() => {
    if (distancePoints.length < 2) return 0

    if (isClosed) {
      const poly = turf.polygon([distancePoints])
      return turf.area(poly)
    } else {
      const line = turf.lineString(distancePoints)
      return turf.length(line, { units: 'kilometers' })
    }
  }, [distancePoints, isClosed])

  const perimeterValue = useMemo(() => {
    if (!isClosed) return 0
    const line = turf.lineString(distancePoints)
    return turf.length(line, { units: 'kilometers' })
  }, [distancePoints, isClosed])

  const formatDistance = (val: number) => {
    // Turkish locale for comma separator
    if (val < 1) return `${(val * 1000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`
    return `${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`
  }

  const formatArea = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km²`
    return `${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`
  }

  // Temporary distance (including ghost point)
  const tempTotalDistance = useMemo(() => {
    if (!distanceGhostPoint || distancePoints.length === 0) return 0
    const currentPoints = [...distancePoints, distanceGhostPoint]
    if (currentPoints.length < 2) return 0
    const line = turf.lineString(currentPoints)
    return turf.length(line, { units: 'kilometers' })
  }, [distancePoints, distanceGhostPoint])


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
      {/* Centered Top Floating Panel - Legacy OneSoil Style */}
      <style>{`
                @keyframes slideDownFade {
                    from { transform: translate(-50%, -20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
      <div
        className="fixed top-[70px] left-1/2 transform -translate-x-1/2 flex items-center gap-[8px] z-[2001] font-sans pointer-events-auto"
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '7px 11px',
          borderRadius: '8px',
          boxShadow: '0 3px 14px rgba(0, 0, 0, 0.3)',
          minHeight: '31px',
          animation: 'slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <button
          onClick={resetDistance}
          className="flex items-center gap-[4px] text-white/70 text-[10px] font-medium px-[6px] py-[3px] rounded-[4px] hover:bg-white/10 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
        >
          ESC
        </button>

        <div className="w-[1px] h-[17px] bg-white/20"></div>

        {isClosed ? (
          <div className="flex items-center gap-[8px]">
            <div className="flex items-center gap-[6px]">
              <span className="text-white/60 text-[10px] font-normal">Çevre</span>
              <span className="text-white text-[11px] font-bold tracking-[0.3px]">{formatDistance(perimeterValue)}</span>
            </div>
            <div className="w-[1px] h-[17px] bg-white/20"></div>
            <div className="flex items-center gap-[6px]">
              <span className="text-white/60 text-[10px] font-normal">Alan</span>
              <span className="text-white text-[13px] font-bold tracking-[0.3px]">{formatArea(measurementValue)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-[6px]">
            <span className="text-white/60 text-[10px] font-normal">Mesafe</span>
            <span className="text-white text-[13px] font-bold tracking-[0.3px]">
              {isDrawingDistance
                ? formatDistance(tempTotalDistance)
                : formatDistance(measurementValue)
              }
            </span>
          </div>
        )}
      </div>

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
