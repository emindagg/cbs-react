import type { FeatureCollection, LineString } from 'geojson'
import type maplibregl from 'maplibre-gl'
import { useEffect, useMemo, useCallback } from 'react'
import { useMap, Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { LayerProps } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

import { useElevationProfile } from '../hooks/useElevationProfile'


export default function ElevationProfileTool() {
  const { current: map } = useMap()
  const { activeTool } = useToolStore()
  const isActive = activeTool === 'elevation-profile'

  const {
    waypoints,
    ghostPoint,
    elevationData,
    hoverIndex,
    addWaypoint,
    setGhostPoint,
    reset,
  } = useElevationProfile()

  const handleMouseMove = useCallback((e: maplibregl.MapMouseEvent) => {
    setGhostPoint([e.lngLat.lng, e.lngLat.lat])
  }, [setGhostPoint])

  const handleClick = useCallback((e: maplibregl.MapMouseEvent) => {
    addWaypoint([e.lngLat.lng, e.lngLat.lat])
  }, [addWaypoint])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') reset()
  }, [reset])

  useEffect(() => {
    if (!map || !isActive) return
    const mapInstance = map as unknown as maplibregl.Map

    mapInstance.getCanvas().style.cursor = 'crosshair'
    mapInstance.on('mousemove', handleMouseMove)
    mapInstance.on('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      mapInstance.off('mousemove', handleMouseMove)
      mapInstance.off('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      mapInstance.getCanvas().style.cursor = ''
    }
  }, [map, isActive, handleMouseMove, handleClick, handleKeyDown])

  // Preview line: waypoints + ghostPoint
  const previewGeoJSON = useMemo((): FeatureCollection<LineString> => {
    if (waypoints.length === 0) return { type: 'FeatureCollection', features: [] }
    const coords: [number, number][] = ghostPoint
      ? [...waypoints, ghostPoint]
      : waypoints

    if (coords.length < 2) return { type: 'FeatureCollection', features: [] }

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {},
      }],
    }
  }, [waypoints, ghostPoint])

  // Route result line (from elevation data)
  const routeGeoJSON = useMemo((): FeatureCollection<LineString> => {
    if (!elevationData || elevationData.length < 2) {
      return { type: 'FeatureCollection', features: [] }
    }

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: elevationData.map((p) => [p.lng, p.lat]),
        },
        properties: {},
      }],
    }
  }, [elevationData])

  const previewLineLayer: LayerProps = {
    id: 'elevation-preview-line',
    type: 'line',
    paint: {
      'line-color': '#6366f1',
      'line-width': 2,
      'line-dasharray': [4, 3],
      'line-opacity': 0.8,
    },
  }

  const routeLineLayer: LayerProps = {
    id: 'elevation-route-line',
    type: 'line',
    paint: {
      'line-color': '#3b82f6',
      'line-width': 3,
      'line-opacity': 0.9,
    },
  }

  if (!isActive && !elevationData) return null

  const hoverPoint = hoverIndex !== null && elevationData ? elevationData[hoverIndex] : null

  return (
    <>
      {/* Waypoint markers */}
      {isActive && waypoints.map((pt, idx) => (
        <Marker key={idx} longitude={pt[0]} latitude={pt[1]}>
          <div
            className="rounded-full border-2 border-white"
            style={{
              width: 10,
              height: 10,
              background: '#6366f1',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          />
        </Marker>
      ))}

      {/* Preview line while drawing */}
      {isActive && previewGeoJSON.features.length > 0 && (
        <Source id="elevation-preview-source" type="geojson" data={previewGeoJSON}>
          <Layer {...previewLineLayer} />
        </Source>
      )}

      {/* Finished route line */}
      {routeGeoJSON.features.length > 0 && (
        <Source id="elevation-route-source" type="geojson" data={routeGeoJSON}>
          <Layer {...routeLineLayer} />
        </Source>
      )}

      {/* Hover marker on chart interaction */}
      {hoverPoint && (
        <Marker longitude={hoverPoint.lng} latitude={hoverPoint.lat}>
          <div className="flex flex-col items-center">
            <div
              className="rounded-full border-2 border-white shadow-lg"
              style={{ width: 12, height: 12, background: '#ef4444' }}
            />
            <div className="bg-red-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded mt-0.5 shadow whitespace-nowrap">
              {hoverPoint.elevation}m
            </div>
          </div>
        </Marker>
      )}
    </>
  )
}
