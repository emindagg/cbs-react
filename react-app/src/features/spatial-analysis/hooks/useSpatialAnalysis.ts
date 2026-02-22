import { useEffect, useRef, useCallback, useMemo } from 'react'

import { useDataManagementStore } from '@/features/data-management'
import { useMapStore } from '@/stores/useMapStore'

import { ConvexHullRenderer } from '../services/ConvexHullRenderer'
import { NearestPointsRenderer } from '../services/NearestPointsRenderer'
import { VoronoiRenderer } from '../services/VoronoiRenderer'
import { useSpatialAnalysisStore } from '../stores/useSpatialAnalysisStore'
import type { SpatialAnalysisType } from '../types'

function extractPointsFromItems(
  items: { geometry: GeoJSON.Geometry; properties: Record<string, unknown>; visible: boolean }[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = []

  for (const item of items) {
    if (!item.visible) continue
    const geom = item.geometry

    if (geom.type === 'Point') {
      features.push({
        type: 'Feature',
        geometry: geom,
        properties: { ...item.properties },
      })
    } else if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      const coords = geom.type === 'Polygon'
        ? geom.coordinates[0]
        : geom.coordinates.flat(1)[0]
      if (!coords || coords.length === 0) continue
      const [sumLon, sumLat] = coords.reduce(
        ([sLon, sLat], [lon, lat]) => [sLon + lon, sLat + lat],
        [0, 0],
      )
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [sumLon / coords.length, sumLat / coords.length],
        },
        properties: { ...item.properties },
      })
    } else if (geom.type === 'LineString') {
      const mid = geom.coordinates[Math.floor(geom.coordinates.length / 2)]
      if (!mid) continue
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: mid },
        properties: { ...item.properties },
      })
    }
  }

  return { type: 'FeatureCollection', features }
}

export function useSpatialAnalysis() {
  const map = useMapStore((s) => s.mapInstance)
  const items = useDataManagementStore((s) => s.items)

  const allItems = useMemo(
    () => items.filter((i) => i.visible),
    [items],
  )

  const {
    activeAnalysis,
    isPanelOpen,
    convexHullStyle,
    voronoiStyle,
    nearestPointsStyle,
    nearestPointsConfig,
    nearestStats,
    toggle,
    deactivate,
    setPanelOpen,
    setConvexHullStyle,
    setVoronoiStyle,
    setNearestPointsStyle,
    setNearestPointsConfig,
    setNearestStats,
  } = useSpatialAnalysisStore()

  const convexRef = useRef<ConvexHullRenderer | null>(null)
  const voronoiRef = useRef<VoronoiRenderer | null>(null)
  const nearestRef = useRef<NearestPointsRenderer | null>(null)

  const getConvexRenderer = useCallback(() => {
    if (!map) return null
    if (!convexRef.current) convexRef.current = new ConvexHullRenderer(map)
    return convexRef.current
  }, [map])

  const getVoronoiRenderer = useCallback(() => {
    if (!map) return null
    if (!voronoiRef.current) voronoiRef.current = new VoronoiRenderer(map)
    return voronoiRef.current
  }, [map])

  const getNearestRenderer = useCallback(() => {
    if (!map) return null
    if (!nearestRef.current) nearestRef.current = new NearestPointsRenderer(map)
    return nearestRef.current
  }, [map])

  useEffect(() => {
    const convex = getConvexRenderer()
    const voronoi = getVoronoiRenderer()
    const nearest = getNearestRenderer()
    if (!convex || !voronoi || !nearest) return

    const points = extractPointsFromItems(allItems)

    convex.remove()
    voronoi.remove()
    nearest.remove()

    if (activeAnalysis === 'convex-hull' && points.features.length >= 3) {
      convex.render(points, convexHullStyle)
      setNearestStats(null)
    } else if (activeAnalysis === 'voronoi' && points.features.length >= 2) {
      voronoi.render(points, voronoiStyle)
      setNearestStats(null)
    } else if (activeAnalysis === 'nearest-points' && points.features.length >= 2) {
      const stats = nearest.render(points, nearestPointsStyle, nearestPointsConfig)
      setNearestStats(stats)
    } else {
      setNearestStats(null)
    }
  }, [activeAnalysis, allItems, convexHullStyle, voronoiStyle, nearestPointsStyle, nearestPointsConfig, getConvexRenderer, getVoronoiRenderer, getNearestRenderer, setNearestStats])

  useEffect(() => {
    return () => {
      convexRef.current?.remove()
      voronoiRef.current?.remove()
      nearestRef.current?.remove()
      convexRef.current = null
      voronoiRef.current = null
      nearestRef.current = null
    }
  }, [map])

  const toggleAnalysis = useCallback((type: SpatialAnalysisType) => {
    toggle(type)
  }, [toggle])

  const pointCount = useMemo(() => {
    return extractPointsFromItems(allItems).features.length
  }, [allItems])

  return {
    activeAnalysis,
    isPanelOpen,
    convexHullStyle,
    voronoiStyle,
    nearestPointsStyle,
    nearestPointsConfig,
    nearestStats,
    toggleAnalysis,
    deactivate,
    setPanelOpen,
    setConvexHullStyle,
    setVoronoiStyle,
    setNearestPointsStyle,
    setNearestPointsConfig,
    pointCount,
    hasData: allItems.length > 0,
  }
}
