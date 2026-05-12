import * as turf from '@turf/turf'
import { useEffect, useRef, useCallback, useMemo } from 'react'

import { useDataManagementStore } from '@/stores/useDataManagementStore'
import { useMapStore } from '@/stores/useMapStore'

import { ConvexHullRenderer } from '../services/ConvexHullRenderer'
import { NearestPointsRenderer } from '../services/NearestPointsRenderer'
import { VoronoiRenderer } from '../services/VoronoiRenderer'
import { useSpatialAnalysisStore } from '../stores/useSpatialAnalysisStore'
import type { SpatialAnalysisType, SpatialLayerOption } from '../types'

const DRAWN_LAYER_ID = '__drawn__'
const DRAWN_LAYER_LABEL = 'Çizilenler'

type SpatialItem = {
  id?: string
  name?: string
  geometry: GeoJSON.Geometry
  properties: Record<string, unknown>
  visible: boolean
  source?: 'drawn' | 'imported'
  sourceLabel?: string
}

function layerIdOf(item: SpatialItem): string {
  if (item.source === 'imported' && item.sourceLabel) return item.sourceLabel
  return DRAWN_LAYER_ID
}

function layerLabelOf(id: string): string {
  return id === DRAWN_LAYER_ID ? DRAWN_LAYER_LABEL : id
}

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

function extractBoundaryPointsFromItems(
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
      continue
    }

    if (
      geom.type !== 'LineString'
      && geom.type !== 'MultiLineString'
      && geom.type !== 'Polygon'
      && geom.type !== 'MultiPolygon'
    ) {
      continue
    }

    const exploded = turf.explode({
      type: 'Feature',
      geometry: geom,
      properties: {},
    })

    for (const pt of exploded.features) {
      features.push({
        type: 'Feature',
        geometry: pt.geometry,
        properties: { ...item.properties },
      })
    }
  }

  return { type: 'FeatureCollection', features }
}

function extractGeometryFeaturesFromItems(
  items: SpatialItem[],
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  const features: GeoJSON.Feature<GeoJSON.Geometry>[] = []

  for (const item of items) {
    if (!item.visible) continue
    features.push({
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        ...item.properties,
        itemId: item.id,
        itemName: item.name,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}

function buildLayerOptions(items: SpatialItem[]): SpatialLayerOption[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!item.visible) continue
    const id = layerIdOf(item)
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([id, count]) => ({
    id,
    label: layerLabelOf(id),
    count,
  }))
}

export function useSpatialAnalysis() {
  const map = useMapStore((s) => s.mapInstance)
  const items = useDataManagementStore((s) => s.items)

  const allItems = useMemo(
    () => items.filter((i) => i.visible),
    [items],
  )
  const representativePoints = useMemo(
    () => extractPointsFromItems(allItems),
    [allItems],
  )
  const boundaryPoints = useMemo(
    () => extractBoundaryPointsFromItems(allItems),
    [allItems],
  )
  const geometryFeatures = useMemo(
    () => extractGeometryFeaturesFromItems(allItems),
    [allItems],
  )
  const availableLayers = useMemo<SpatialLayerOption[]>(
    () => buildLayerOptions(allItems),
    [allItems],
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

  const filterByLayer = useCallback(
    (layerId: string | null): GeoJSON.FeatureCollection<GeoJSON.Geometry> => {
      if (!layerId) return geometryFeatures
      const features = allItems
        .filter((item) => layerIdOf(item) === layerId)
        .map<GeoJSON.Feature<GeoJSON.Geometry>>((item) => ({
          type: 'Feature',
          geometry: item.geometry,
          properties: { ...item.properties, itemId: item.id, itemName: item.name },
        }))
      return { type: 'FeatureCollection', features }
    },
    [allItems, geometryFeatures],
  )

  useEffect(() => {
    const convex = getConvexRenderer()
    const voronoi = getVoronoiRenderer()
    const nearest = getNearestRenderer()
    if (!convex || !voronoi || !nearest) return

    convex.remove()
    voronoi.remove()
    nearest.remove()

    if (activeAnalysis === 'convex-hull' && boundaryPoints.features.length >= 3) {
      convex.render(boundaryPoints, convexHullStyle)
      setNearestStats(null)
    } else if (activeAnalysis === 'voronoi' && representativePoints.features.length >= 2) {
      voronoi.render(representativePoints, voronoiStyle)
      setNearestStats(null)
    } else if (activeAnalysis === 'nearest-points') {
      const { inputLayer, targetLayer } = nearestPointsConfig
      const hasLayerSelection = Boolean(inputLayer)
      const inputFC = hasLayerSelection ? filterByLayer(inputLayer) : geometryFeatures
      const isCrossLayer = hasLayerSelection && targetLayer !== null && targetLayer !== inputLayer
      const targetFC = isCrossLayer ? filterByLayer(targetLayer) : null

      const minNeeded = targetFC ? 1 : 2
      const ready = inputFC.features.length >= minNeeded && (!targetFC || targetFC.features.length >= 1)

      if (ready) {
        const stats = nearest.render(inputFC, targetFC, nearestPointsStyle, nearestPointsConfig)
        setNearestStats(stats)
      } else {
        setNearestStats(null)
      }
    } else {
      setNearestStats(null)
    }
  }, [activeAnalysis, boundaryPoints, representativePoints, geometryFeatures, convexHullStyle, voronoiStyle, nearestPointsStyle, nearestPointsConfig, getConvexRenderer, getVoronoiRenderer, getNearestRenderer, setNearestStats, filterByLayer])

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
    if (activeAnalysis === 'convex-hull') return boundaryPoints.features.length
    if (activeAnalysis === 'nearest-points') {
      const { inputLayer } = nearestPointsConfig
      if (inputLayer) return filterByLayer(inputLayer).features.length
      return geometryFeatures.features.length
    }
    return representativePoints.features.length
  }, [activeAnalysis, boundaryPoints, representativePoints, geometryFeatures, nearestPointsConfig, filterByLayer])

  const convexHullAreaKm2 = useMemo(() => {
    if (boundaryPoints.features.length < 3) return null
    const hull = turf.convex(boundaryPoints)
    if (!hull) return null
    return turf.area(hull) / 1_000_000
  }, [boundaryPoints])

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
    convexHullAreaKm2,
    hasData: allItems.length > 0,
    availableLayers,
  }
}
