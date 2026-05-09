import type { FeatureCollection, LineString, Point } from 'geojson'
import type maplibregl from 'maplibre-gl'
import type { GeoJSONSource } from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

import { useElevationProfile } from '../hooks/useElevationProfile'
import { useElevationProfileStore } from '../stores/useElevationProfileStore'

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

// Hover marker
const LYR_HOVER_DOT = 'elev-hover-dot'


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

function ensurePreviewLayers(m: maplibregl.Map) {
  ensureSource(m, SRC_PREVIEW)
  ensureSource(m, SRC_WAYPOINTS)

  // Preview çizgisi: 2.5px siyah
  ensureLayer(m, {
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
  ensureLayer(m, {
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
}

function ensureRouteLayers(m: maplibregl.Map) {
  ensureSource(m, SRC_ROUTE)

  // Route: glow
  ensureLayer(m, {
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
  ensureLayer(m, {
    id: LYR_ROUTE,
    type: 'line',
    source: SRC_ROUTE,
    paint: {
      'line-color': '#000000',
      'line-width': 2,
      'line-opacity': 0.85,
    },
  } as maplibregl.LineLayerSpecification)
}

function ensureHoverLayers(m: maplibregl.Map) {
  ensureSource(m, SRC_HOVER)
  ensureLayer(m, {
    id: LYR_HOVER_DOT,
    type: 'circle',
    source: SRC_HOVER,
    paint: {
      'circle-radius': 4.5,
      'circle-color': C_WHITE,
      'circle-stroke-width': 2.5,
      'circle-stroke-color': C_RED,
      'circle-stroke-opacity': 1,
      'circle-opacity': 1,
    },
  } as maplibregl.CircleLayerSpecification)
}

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
  const addWaypointRef  = useRef(store.addWaypoint)
  const resetRef        = useRef(store.reset)
  useEffect(() => { addWaypointRef.current = store.addWaypoint }, [store.addWaypoint])
  useEffect(() => { resetRef.current = store.reset }, [store.reset])

  // Çizim tamamlandı bayrağı — ghost line'ı durdurur
  const drawingDoneRef = useRef(false)

  useEffect(() => {
    waypointsRef.current = store.waypoints
    if (store.waypoints.length === 0) drawingDoneRef.current = false
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

    ensurePreviewLayers(map)

    map.getCanvas().style.cursor = 'crosshair'
    map.doubleClickZoom.disable()
    drawingDoneRef.current = false

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (drawingDoneRef.current) return
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

    // Çift tıklama / mobil çift dokunma: ghost line durdur, son eklenen fazla noktayı temizle
    const handleDblClick = () => {
      drawingDoneRef.current = true
      const pts = waypointsRef.current.slice(0, -1)
      waypointsRef.current = pts
      ghostRef.current = null
      // Ghost kaldır, waypoint'ler arası çizgiyi koru
      setSource(map, SRC_PREVIEW, pts.length >= 2 ? lineFC(pts) : EMPTY_FC as FeatureCollection<LineString>)
      setSource(map, SRC_WAYPOINTS, pointFC(pts))
    }

    // Sağ tık: ghost line durdur, waypoint'ler arası çizgiyi koru
    const handleContextMenu = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault()
      drawingDoneRef.current = true
      ghostRef.current = null
      const pts = waypointsRef.current
      setSource(map, SRC_PREVIEW, pts.length >= 2 ? lineFC(pts) : EMPTY_FC as FeatureCollection<LineString>)
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
    map.on('dblclick', handleDblClick)
    map.on('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      map.off('mousemove', handleMouseMove)
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
      map.off('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      map.getCanvas().style.cursor = ''
      map.doubleClickZoom.enable()
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
    ensureRouteLayers(map)
    setSource(map, SRC_ROUTE, lineFC(coords))

    // Analiz tamamlandı: preview + waypoint marker'larını temizle
    setSource(map, SRC_PREVIEW, EMPTY_FC as FeatureCollection<LineString>)
    setSource(map, SRC_WAYPOINTS, EMPTY_FC as FeatureCollection<Point>)
  }, [mapObj, store.elevationData])

  // ─── Map-Chart Sync: Tracking Marker ────────────────────────────────────
  // Performans: React render döngüsü yok — Zustand aboneliği ile MapLibre doğrudan güncellenir.
  useEffect(() => {
    const map = mapObj?.getMap() as maplibregl.Map | null ?? null
    if (!map) return

    // Doğrudan Zustand aboneliği — setActivePoint her çağrıldığında
    // React render tetiklenmeden MapLibre source güncellenir
    const unsub = useElevationProfileStore.subscribe((state, prev) => {
      if (state.activePoint === prev.activePoint) return
      if (!state.activePoint) {
        setSource(map, SRC_HOVER, EMPTY_FC as FeatureCollection<Point>)
        return
      }
      ensureHoverLayers(map)
      setSource(map, SRC_HOVER, pointFC([[state.activePoint.lng, state.activePoint.lat]]))
    })

    return unsub
  }, [mapObj])

  // ─── Style yenilenince kaybolan katmanları geri kur ───────────────────────
  useEffect(() => {
    const map = mapObj?.getMap() as maplibregl.Map | null ?? null
    if (!map) return

    const syncElevationLayers = () => {
      if (!map.isStyleLoaded()) return

      if (isActive) {
        ensurePreviewLayers(map)
        const pts = waypointsRef.current
        const previewCoords = !drawingDoneRef.current && ghostRef.current
          ? [...pts, ghostRef.current]
          : pts
        setSource(map, SRC_PREVIEW, previewCoords.length >= 2 ? lineFC(previewCoords) : EMPTY_FC as FeatureCollection<LineString>)
        setSource(map, SRC_WAYPOINTS, store.elevationData ? EMPTY_FC as FeatureCollection<Point> : pointFC(pts))
      }

      if (store.elevationData && store.elevationData.length >= 2) {
        const coords = store.elevationData.map((p): [number, number] => [p.lng, p.lat])
        ensureRouteLayers(map)
        setSource(map, SRC_ROUTE, lineFC(coords))
        setSource(map, SRC_PREVIEW, EMPTY_FC as FeatureCollection<LineString>)
        setSource(map, SRC_WAYPOINTS, EMPTY_FC as FeatureCollection<Point>)
      }

      const activePoint = useElevationProfileStore.getState().activePoint
      if (activePoint) {
        ensureHoverLayers(map)
        setSource(map, SRC_HOVER, pointFC([[activePoint.lng, activePoint.lat]]))
      }
    }

    syncElevationLayers()
    map.on('styledata', syncElevationLayers)
    map.on('idle', syncElevationLayers)

    return () => {
      map.off('styledata', syncElevationLayers)
      map.off('idle', syncElevationLayers)
    }
  }, [mapObj, isActive, store.elevationData, store.waypoints])

  // ─── Reset ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (store.waypoints.length > 0 || store.elevationData) return
    const map = mapObj?.getMap() as maplibregl.Map | null ?? null
    if (!map) return
    setSource(map, SRC_PREVIEW, EMPTY_FC as FeatureCollection<LineString>)
    setSource(map, SRC_WAYPOINTS, EMPTY_FC as FeatureCollection<Point>)
    removeLayers(map, [LYR_ROUTE_GLOW, LYR_ROUTE, LYR_HOVER_DOT])
    removeSources(map, [SRC_ROUTE, SRC_HOVER])
  }, [mapObj, store.waypoints, store.elevationData])

  return null
}
