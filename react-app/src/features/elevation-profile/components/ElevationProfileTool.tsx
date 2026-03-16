import type { FeatureCollection, LineString, Point } from 'geojson'
import type maplibregl from 'maplibre-gl'
import type { GeoJSONSource } from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

import { useElevationProfile } from '../hooks/useElevationProfile'

// ─── Sabit GeoJSON yapıları ───────────────────────────────────────────────────
const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] }

function lineFC(coords: [number, number][]): FeatureCollection<LineString> {
  if (coords.length < 2) return EMPTY_FC as FeatureCollection<LineString>
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {},
    }],
  }
}

function pointFC(coords: [number, number][]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: coords.map((c) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: c },
      properties: {},
    })),
  }
}

// ─── Source / Layer ID'leri ───────────────────────────────────────────────────
const SRC_PREVIEW   = 'elev-preview'
const SRC_WAYPOINTS = 'elev-waypoints'
const SRC_ROUTE     = 'elev-route'
const SRC_HOVER     = 'elev-hover'

// Preview: 2.5px siyah çizgi
const LYR_PREVIEW   = 'elev-preview-line'

// Waypoints: beyaz dolgulu halka
const LYR_WAYPOINTS = 'elev-waypoints-circles'

// Route: glow + çizgi
const LYR_ROUTE_GLOW = 'elev-route-glow'
const LYR_ROUTE      = 'elev-route-line'

// Hover dot: glow + nokta
const LYR_HOVER_GLOW = 'elev-hover-glow'
const LYR_HOVER_DOT  = 'elev-hover-dot'


// ─── Yardımcılar ─────────────────────────────────────────────────────────────
function setSource(m: maplibregl.Map, id: string, data: FeatureCollection) {
  const src = m.getSource(id) as GeoJSONSource | undefined
  if (src) src.setData(data)
}

function ensureSource(m: maplibregl.Map, id: string) {
  if (!m.getSource(id)) {
    m.addSource(id, { type: 'geojson', data: EMPTY_FC })
  }
}

function ensureLayer(m: maplibregl.Map, layer: maplibregl.LayerSpecification) {
  if (!m.getLayer(layer.id)) m.addLayer(layer)
}

function removeLayers(m: maplibregl.Map, ids: string[]) {
  ids.forEach(id => { if (m.getLayer(id)) m.removeLayer(id) })
}

function removeSources(m: maplibregl.Map, ids: string[]) {
  ids.forEach(id => { if (m.getSource(id)) m.removeSource(id) })
}

// ─── Renk sabitleri ───────────────────────────────────────────────────────────
const C_WHITE = '#ffffff'
const C_RED   = '#f43f5e'

// ─── Bileşen ──────────────────────────────────────────────────────────────────
export default function ElevationProfileTool() {
  const { current: mapObj } = useMap()
  const { activeTool } = useToolStore()
  const isActive = activeTool === 'elevation-profile'

  const store = useElevationProfile()

  // Hot-path ref'leri — render yok
  const ghostRef     = useRef<[number, number] | null>(null)
  const waypointsRef = useRef<[number, number][]>([])

  // Store action ref'leri
  const addWaypointRef = useRef(store.addWaypoint)
  const resetRef       = useRef(store.reset)
  useEffect(() => { addWaypointRef.current = store.addWaypoint }, [store.addWaypoint])
  useEffect(() => { resetRef.current = store.reset }, [store.reset])

  useEffect(() => {
    waypointsRef.current = store.waypoints
  }, [store.waypoints])

  // ─── Çizim: setup / teardown ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapObj?.getMap() as maplibregl.Map | null ?? null
    if (!map) return

    if (!isActive) {
      removeLayers(map, [LYR_PREVIEW, LYR_WAYPOINTS])
      removeSources(map, [SRC_PREVIEW, SRC_WAYPOINTS])
      ghostRef.current = null
      return
    }

    ensureSource(map, SRC_PREVIEW)
    ensureSource(map, SRC_WAYPOINTS)

    // Preview çizgisi: 2.5px siyah
    ensureLayer(map, {
      id: LYR_PREVIEW,
      type: 'line',
      source: SRC_PREVIEW,
      paint: {
        'line-color': '#000000',
        'line-width': 2,
        'line-opacity': 0.85,
      },
    } as maplibregl.LineLayerSpecification)

    // Waypoints: beyaz dolgulu halka
    ensureLayer(map, {
      id: LYR_WAYPOINTS,
      type: 'circle',
      source: SRC_WAYPOINTS,
      paint: {
        'circle-radius': 7,
        'circle-color': C_WHITE,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#000000',
        'circle-stroke-opacity': 0.85,
        'circle-opacity': 1,
      },
    } as maplibregl.CircleLayerSpecification)

    map.getCanvas().style.cursor = 'crosshair'

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      ghostRef.current = [e.lngLat.lng, e.lngLat.lat]
      const pts = waypointsRef.current
      const coords: [number, number][] = pts.length > 0
        ? [...pts, ghostRef.current]
        : [ghostRef.current, ghostRef.current]
      setSource(map, SRC_PREVIEW, lineFC(coords))
    }

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      const next = [...waypointsRef.current, pt]
      waypointsRef.current = next
      addWaypointRef.current(pt)
      setSource(map, SRC_WAYPOINTS, pointFC(next))
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        ghostRef.current = null
        waypointsRef.current = []
        setSource(map, SRC_PREVIEW, EMPTY_FC as FeatureCollection<LineString>)
        setSource(map, SRC_WAYPOINTS, EMPTY_FC as FeatureCollection<Point>)
        resetRef.current()
      }
    }

    map.on('mousemove', handleMouseMove)
    map.on('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      map.off('mousemove', handleMouseMove)
      map.off('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      map.getCanvas().style.cursor = ''
      removeLayers(map, [LYR_PREVIEW, LYR_WAYPOINTS])
      removeSources(map, [SRC_PREVIEW, SRC_WAYPOINTS])
      ghostRef.current = null
    }
   
  }, [mapObj, isActive])

  // ─── Analiz sonucu: rota çizgisi ─────────────────────────────────────────
  useEffect(() => {
    const map = mapObj?.getMap() as maplibregl.Map | null ?? null
    if (!map) return

    if (!store.elevationData || store.elevationData.length < 2) {
      removeLayers(map, [LYR_ROUTE_GLOW, LYR_ROUTE])
      removeSources(map, [SRC_ROUTE])
      return
    }

    const coords = store.elevationData.map((p): [number, number] => [p.lng, p.lat])
    ensureSource(map, SRC_ROUTE)

    // Route: glow
    ensureLayer(map, {
      id: LYR_ROUTE_GLOW,
      type: 'line',
      source: SRC_ROUTE,
      paint: {
        'line-color': '#000000',
        'line-width': 16,
        'line-opacity': 0.08,
        'line-blur': 10,
      },
    } as maplibregl.LineLayerSpecification)

    // Route: çizgi
    ensureLayer(map, {
      id: LYR_ROUTE,
      type: 'line',
      source: SRC_ROUTE,
      paint: {
        'line-color': '#000000',
        'line-width': 2,
        'line-opacity': 0.85,
      },
    } as maplibregl.LineLayerSpecification)

    setSource(map, SRC_ROUTE, lineFC(coords))

    // Analiz tamamlandı: preview + waypoint marker'larını temizle
    setSource(map, SRC_PREVIEW, EMPTY_FC as FeatureCollection<LineString>)
    setSource(map, SRC_WAYPOINTS, EMPTY_FC as FeatureCollection<Point>)
  }, [mapObj, store.elevationData])

  // ─── Map-Chart Sync: Tracking Marker ────────────────────────────────────
  // Drawing/route efektleriyle aynı pattern: [mapObj, store.activePoint] bağımlılığı.
  useEffect(() => {
    const map = mapObj?.getMap() as maplibregl.Map | null ?? null
    if (!map) return

    if (!store.activePoint) {
      setSource(map, SRC_HOVER, EMPTY_FC as FeatureCollection<Point>)
      return
    }

    ensureSource(map, SRC_HOVER)
    ensureLayer(map, {
      id: LYR_HOVER_GLOW,
      type: 'circle',
      source: SRC_HOVER,
      paint: {
        'circle-radius': 20,
        'circle-color': C_RED,
        'circle-opacity': 0.18,
        'circle-stroke-width': 0,
        'circle-blur': 0.5,
      },
    } as maplibregl.CircleLayerSpecification)
    ensureLayer(map, {
      id: LYR_HOVER_DOT,
      type: 'circle',
      source: SRC_HOVER,
      paint: {
        'circle-radius': 7,
        'circle-color': C_WHITE,
        'circle-stroke-width': 3,
        'circle-stroke-color': C_RED,
        'circle-stroke-opacity': 1,
        'circle-opacity': 1,
      },
    } as maplibregl.CircleLayerSpecification)
    setSource(map, SRC_HOVER, pointFC([[store.activePoint.lng, store.activePoint.lat]]))
  }, [mapObj, store.activePoint])

  // ─── Reset ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (store.waypoints.length > 0 || store.elevationData) return
    const map = mapObj?.getMap() as maplibregl.Map | null ?? null
    if (!map) return
    setSource(map, SRC_PREVIEW, EMPTY_FC as FeatureCollection<LineString>)
    setSource(map, SRC_WAYPOINTS, EMPTY_FC as FeatureCollection<Point>)
    removeLayers(map, [LYR_ROUTE_GLOW, LYR_ROUTE, LYR_HOVER_GLOW, LYR_HOVER_DOT])
    removeSources(map, [SRC_ROUTE, SRC_HOVER])
  }, [mapObj, store.waypoints, store.elevationData])

  return null
}
