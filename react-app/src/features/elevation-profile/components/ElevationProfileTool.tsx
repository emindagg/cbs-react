import type { FeatureCollection, LineString, Point } from 'geojson'
import type maplibregl from 'maplibre-gl'
import type { GeoJSONSource } from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'

import { useToolStore } from '@/stores/useToolStore'

import { useElevationProfile } from '../hooks/useElevationProfile'

// ─── Sabit GeoJSON yapıları (her render'da yeni obje yaratmamak için) ─────────
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

// ─── Source/Layer ID'leri ────────────────────────────────────────────────────
const SRC_PREVIEW    = 'elev-preview'
const SRC_WAYPOINTS  = 'elev-waypoints'
const SRC_ROUTE      = 'elev-route'
const SRC_HOVER      = 'elev-hover'
const LYR_PREVIEW    = 'elev-preview-line'
const LYR_WAYPOINTS  = 'elev-waypoints-circles'
const LYR_ROUTE      = 'elev-route-line'
const LYR_HOVER_DOT  = 'elev-hover-dot'

// ─── Yardımcı: source varsa setData, yoksa addSource ────────────────────────
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

// ─── Bileşen ─────────────────────────────────────────────────────────────────
export default function ElevationProfileTool() {
  const { current: mapObj } = useMap()
  const { activeTool } = useToolStore()
  const isActive = activeTool === 'elevation-profile'

  const store = useElevationProfile()

  // Hot-path ref'leri — React state güncellemesi yok, render yok
  const ghostRef    = useRef<[number, number] | null>(null)
  const waypointsRef = useRef<[number, number][]>([])

  // Store action ref'leri (stale closure önlemi)
  const addWaypointRef = useRef(store.addWaypoint)
  const resetRef       = useRef(store.reset)
  useEffect(() => { addWaypointRef.current = store.addWaypoint }, [store.addWaypoint])
  useEffect(() => { resetRef.current = store.reset }, [store.reset])

  // waypointsRef'i store'la senkron tut (sadece tıklamada değişir)
  useEffect(() => {
    waypointsRef.current = store.waypoints
  }, [store.waypoints])

  // ─── Çizim araçları: sadece isActive değişince setup/teardown ───────────
  useEffect(() => {
    const map = mapObj as unknown as maplibregl.Map | null
    if (!map) return

    if (!isActive) {
      // Araç devre dışı: preview ve waypoint layer'larını temizle
      // (route ve hover layer'ları elevationData üzerinden yönetiliyor)
      removeLayers(map, [LYR_PREVIEW, LYR_WAYPOINTS])
      removeSources(map, [SRC_PREVIEW, SRC_WAYPOINTS])
      ghostRef.current = null
      return
    }

    // Source'ları ekle
    ensureSource(map, SRC_PREVIEW)
    ensureSource(map, SRC_WAYPOINTS)

    ensureLayer(map, {
      id: LYR_WAYPOINTS,
      type: 'circle',
      source: SRC_WAYPOINTS,
      paint: {
        'circle-radius': 5,
        'circle-color': '#6366f1',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    } as maplibregl.CircleLayerSpecification)

    ensureLayer(map, {
      id: LYR_PREVIEW,
      type: 'line',
      source: SRC_PREVIEW,
      paint: {
        'line-color': '#6366f1',
        'line-width': 2,
        'line-dasharray': [4, 3],
        'line-opacity': 0.85,
      },
    } as maplibregl.LineLayerSpecification)

    map.getCanvas().style.cursor = 'crosshair'

    // ── Mousemove: sıfır React state güncellemesi ──────────────────────────
    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      ghostRef.current = [e.lngLat.lng, e.lngLat.lat]
      const pts = waypointsRef.current
      const coords: [number, number][] = pts.length > 0
        ? [...pts, ghostRef.current]
        : [ghostRef.current, ghostRef.current]
      setSource(map, SRC_PREVIEW, lineFC(coords))
    }

    // ── Click: waypoint ekle ve source'u güncelle ──────────────────────────
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      const next = [...waypointsRef.current, pt]
      waypointsRef.current = next
      addWaypointRef.current(pt)
      setSource(map, SRC_WAYPOINTS, pointFC(next))
    }

    // ── Escape: sıfırla ────────────────────────────────────────────────────
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapObj, isActive])

  // ─── Analiz sonucu: rota çizgisi ─────────────────────────────────────────
  useEffect(() => {
    const map = mapObj as unknown as maplibregl.Map | null
    if (!map) return

    if (!store.elevationData || store.elevationData.length < 2) {
      removeLayers(map, [LYR_ROUTE])
      removeSources(map, [SRC_ROUTE])
      return
    }

    const coords = store.elevationData.map((p): [number, number] => [p.lng, p.lat])
    ensureSource(map, SRC_ROUTE)
    ensureLayer(map, {
      id: LYR_ROUTE,
      type: 'line',
      source: SRC_ROUTE,
      paint: {
        'line-color': '#3b82f6',
        'line-width': 3,
        'line-opacity': 0.9,
      },
    } as maplibregl.LineLayerSpecification)

    setSource(map, SRC_ROUTE, lineFC(coords))

    // Analiz tamamlandı: preview + waypoint marker'larını temizle
    setSource(map, SRC_PREVIEW, EMPTY_FC as FeatureCollection<LineString>)
    setSource(map, SRC_WAYPOINTS, EMPTY_FC as FeatureCollection<Point>)
  }, [mapObj, store.elevationData])

  // ─── Grafik hover: haritada nokta göster ─────────────────────────────────
  useEffect(() => {
    const map = mapObj as unknown as maplibregl.Map | null
    if (!map) return

    if (store.hoverIndex === null || !store.elevationData) {
      setSource(map, SRC_HOVER, EMPTY_FC as FeatureCollection<Point>)
      return
    }

    const pt = store.elevationData[store.hoverIndex]
    if (!pt) return

    ensureSource(map, SRC_HOVER)
    ensureLayer(map, {
      id: LYR_HOVER_DOT,
      type: 'circle',
      source: SRC_HOVER,
      paint: {
        'circle-radius': 6,
        'circle-color': '#ef4444',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    } as maplibregl.CircleLayerSpecification)

    setSource(map, SRC_HOVER, pointFC([[pt.lng, pt.lat]]))
  }, [mapObj, store.hoverIndex, store.elevationData])

  // ─── Reset: tüm layer'ları temizle ───────────────────────────────────────
  useEffect(() => {
    if (store.waypoints.length > 0 || store.elevationData) return
    const map = mapObj as unknown as maplibregl.Map | null
    if (!map) return
    setSource(map, SRC_PREVIEW, EMPTY_FC as FeatureCollection<LineString>)
    setSource(map, SRC_WAYPOINTS, EMPTY_FC as FeatureCollection<Point>)
    removeLayers(map, [LYR_ROUTE, LYR_HOVER_DOT])
    removeSources(map, [SRC_ROUTE, SRC_HOVER])
  }, [mapObj, store.waypoints, store.elevationData])

  // Bu bileşen artık hiçbir DOM elementi render etmiyor
  return null
}
