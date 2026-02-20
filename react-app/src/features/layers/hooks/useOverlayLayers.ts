import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import shp from 'shpjs'

import { useMapStore } from '@/stores/useMapStore'

import { OVERLAY_LAYER_BASE_URL, OVERLAY_LAYER_DEFINITIONS, type OverlayLayerDefinition } from '../config/layerDefinitions'

interface OverlayLayerState {
  enabled: boolean
  loading: boolean
  loaded: boolean
  opacity: number
  color: string
}

type OverlayLayerStateMap = Record<string, OverlayLayerState>

function buildInitialState(): OverlayLayerStateMap {
  return OVERLAY_LAYER_DEFINITIONS.reduce<OverlayLayerStateMap>((acc, layer) => {
    acc[layer.id] = {
      enabled: false,
      loading: false,
      loaded: false,
      opacity: layer.opacity,
      color: layer.color,
    }
    return acc
  }, {})
}

function getSourceId(layerId: string): string {
  return `layer-source-${layerId}`
}

function normalizeFeatureCollection(raw: unknown): FeatureCollection<Geometry> {
  if (raw && typeof raw === 'object' && 'type' in raw && (raw as { type?: string }).type === 'FeatureCollection') {
    return raw as FeatureCollection<Geometry>
  }

  if (Array.isArray(raw)) {
    const mergedFeatures = raw.flatMap((item) => {
      if (item && typeof item === 'object' && 'type' in item && (item as { type?: string }).type === 'FeatureCollection') {
        return ((item as FeatureCollection<Geometry>).features || []) as Feature<Geometry>[]
      }
      return []
    })
    return { type: 'FeatureCollection', features: mergedFeatures }
  }

  if (raw && typeof raw === 'object') {
    const objectValues = Object.values(raw as Record<string, unknown>)
    const mergedFeatures = objectValues.flatMap((value) => {
      if (value && typeof value === 'object' && 'type' in value && (value as { type?: string }).type === 'FeatureCollection') {
        return ((value as FeatureCollection<Geometry>).features || []) as Feature<Geometry>[]
      }
      return []
    })
    return { type: 'FeatureCollection', features: mergedFeatures }
  }

  return { type: 'FeatureCollection', features: [] }
}

function ensureLayerOnMap(
  map: MapLibreMap,
  definition: OverlayLayerDefinition,
  data: FeatureCollection<Geometry>,
  layerState: OverlayLayerState,
) {
  const sourceId = getSourceId(definition.id)

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data,
    })
  }

  if (definition.type === 'line' && !map.getLayer(definition.id)) {
    map.addLayer({
      id: definition.id,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': layerState.color,
        'line-width': 2,
        'line-opacity': layerState.opacity,
      },
    })
  }

  if (definition.type === 'fill' && !map.getLayer(definition.id)) {
    map.addLayer({
      id: definition.id,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': layerState.color,
        'fill-opacity': layerState.opacity,
      },
    })
  }

  if (definition.type === 'fill' && !map.getLayer(`${definition.id}-outline`)) {
    map.addLayer({
      id: `${definition.id}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 0.5,
      },
    })
  }

  if (definition.type === 'circle' && !map.getLayer(definition.id)) {
    map.addLayer({
      id: definition.id,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-color': layerState.color,
        'circle-radius': 5,
        'circle-opacity': layerState.opacity,
      },
    })
  }
}

function applyLayerStyles(map: MapLibreMap, definition: OverlayLayerDefinition, layerState: OverlayLayerState) {
  const visibility = layerState.enabled ? 'visible' : 'none'

  if (map.getLayer(definition.id)) {
    map.setLayoutProperty(definition.id, 'visibility', visibility)
  }
  if (definition.type === 'fill' && map.getLayer(`${definition.id}-outline`)) {
    map.setLayoutProperty(`${definition.id}-outline`, 'visibility', visibility)
  }

  if (definition.type === 'line' && map.getLayer(definition.id)) {
    map.setPaintProperty(definition.id, 'line-color', layerState.color)
    map.setPaintProperty(definition.id, 'line-opacity', layerState.opacity)
  }

  if (definition.type === 'fill' && map.getLayer(definition.id)) {
    map.setPaintProperty(definition.id, 'fill-color', layerState.color)
    map.setPaintProperty(definition.id, 'fill-opacity', layerState.opacity)
  }

  if (definition.type === 'circle' && map.getLayer(definition.id)) {
    map.setPaintProperty(definition.id, 'circle-color', layerState.color)
    map.setPaintProperty(definition.id, 'circle-opacity', layerState.opacity)
  }
}

export function useOverlayLayers() {
  const mapInstance = useMapStore((state) => state.mapInstance)
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [layerStates, setLayerStates] = useState<OverlayLayerStateMap>(() => buildInitialState())
  const layerStatesRef = useRef(layerStates)
  const cacheRef = useRef(new globalThis.Map<string, FeatureCollection<Geometry>>())

  useEffect(() => {
    layerStatesRef.current = layerStates
  }, [layerStates])

  const layers = useMemo(
    () => OVERLAY_LAYER_DEFINITIONS.map((definition) => ({
      ...definition,
      ...layerStates[definition.id],
    })),
    [layerStates],
  )

  const setLayerLoading = useCallback((layerId: string, loading: boolean) => {
    setLayerStates((current) => ({
      ...current,
      [layerId]: {
        ...current[layerId],
        loading,
      },
    }))
  }, [])

  const setLayerEnabledState = useCallback((layerId: string, enabled: boolean) => {
    setLayerStates((current) => ({
      ...current,
      [layerId]: {
        ...current[layerId],
        enabled,
      },
    }))
  }, [])

  const ensureLoadedAndVisible = useCallback(async (layerId: string) => {
    const definition = OVERLAY_LAYER_DEFINITIONS.find((item) => item.id === layerId)
    if (!definition || !mapInstance) return

    const currentState = layerStatesRef.current[layerId]
    if (!currentState || currentState.loading) return

    if (cacheRef.current.has(layerId)) {
      ensureLayerOnMap(mapInstance, definition, cacheRef.current.get(layerId)!, currentState)
      applyLayerStyles(mapInstance, definition, { ...currentState, enabled: true })
      setLayerStates((current) => ({
        ...current,
        [layerId]: {
          ...current[layerId],
          loaded: true,
          enabled: true,
        },
      }))
      return
    }

    setLayerLoading(layerId, true)
    try {
      const rawGeojson = await shp(`${OVERLAY_LAYER_BASE_URL}${definition.file}`)
      const normalized = normalizeFeatureCollection(rawGeojson)
      cacheRef.current.set(layerId, normalized)

      const nextState = {
        ...layerStatesRef.current[layerId],
        enabled: true,
        loaded: true,
      }
      ensureLayerOnMap(mapInstance, definition, normalized, nextState)
      applyLayerStyles(mapInstance, definition, nextState)

      setLayerStates((current) => ({
        ...current,
        [layerId]: {
          ...current[layerId],
          enabled: true,
          loaded: true,
        },
      }))
    } catch (error) {
      console.error(`Katman yüklenemedi (${layerId})`, error)
      setLayerEnabledState(layerId, false)
    } finally {
      setLayerLoading(layerId, false)
    }
  }, [mapInstance, setLayerEnabledState, setLayerLoading])

  const toggleLayer = useCallback(async (layerId: string, enabled: boolean) => {
    if (enabled) {
      await ensureLoadedAndVisible(layerId)
      return
    }

    const definition = OVERLAY_LAYER_DEFINITIONS.find((item) => item.id === layerId)
    if (!definition) return

    if (mapInstance && mapInstance.getLayer(definition.id)) {
      mapInstance.setLayoutProperty(definition.id, 'visibility', 'none')
    }
    if (mapInstance && definition.type === 'fill' && mapInstance.getLayer(`${definition.id}-outline`)) {
      mapInstance.setLayoutProperty(`${definition.id}-outline`, 'visibility', 'none')
    }
    setLayerEnabledState(layerId, false)
  }, [ensureLoadedAndVisible, mapInstance, setLayerEnabledState])

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayerStates((current) => ({
      ...current,
      [layerId]: {
        ...current[layerId],
        opacity,
      },
    }))
  }, [])

  const setLayerColor = useCallback((layerId: string, color: string) => {
    setLayerStates((current) => ({
      ...current,
      [layerId]: {
        ...current[layerId],
        color,
      },
    }))
  }, [])

  useEffect(() => {
    if (!mapInstance) return

    const onStyleData = () => {
      const currentState = layerStatesRef.current
      OVERLAY_LAYER_DEFINITIONS.forEach((definition) => {
        const state = currentState[definition.id]
        if (!state?.enabled) return

        const data = cacheRef.current.get(definition.id)
        if (!data) return

        ensureLayerOnMap(mapInstance, definition, data, state)
        applyLayerStyles(mapInstance, definition, state)
      })
    }

    mapInstance.on('styledata', onStyleData)
    return () => {
      mapInstance.off('styledata', onStyleData)
    }
  }, [mapInstance])

  useEffect(() => {
    if (!mapInstance) return

    OVERLAY_LAYER_DEFINITIONS.forEach((definition) => {
      const state = layerStates[definition.id]
      if (!state?.loaded) return
      if (!mapInstance.getLayer(definition.id)) return
      applyLayerStyles(mapInstance, definition, state)
    })
  }, [layerStates, mapInstance])

  return {
    isPanelOpen,
    openPanel: () => setPanelOpen(true),
    closePanel: () => setPanelOpen(false),
    togglePanel: () => setPanelOpen((current) => !current),
    layers,
    toggleLayer,
    setLayerOpacity,
    setLayerColor,
  }
}
