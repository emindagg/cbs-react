import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import shp from 'shpjs'

import { useMapStore } from '@/stores/useMapStore'

import { OVERLAY_LAYER_BASE_URL, OVERLAY_LAYER_DEFINITIONS, type OverlayLayerDefinition } from '../config/layerDefinitions'

const LAND_COVER_LAYER_ID = 'arazi_ortusu_2018'
const LAND_COVER_FALLBACK_COLOR = '#ffffff'
const LAND_COVER_COLOR_BY_CODE: Record<number, string> = {
  1: '#e31a1c',
  2: '#ff7f00',
  3: '#33a02c',
  4: '#a6cee3',
  5: '#1f78b4',
}

export const LAND_COVER_LEGEND_ITEMS = [
  { code: 1, label: 'Yapay Bölgeler', color: LAND_COVER_COLOR_BY_CODE[1] },
  { code: 2, label: 'Tarımsal Alanlar', color: LAND_COVER_COLOR_BY_CODE[2] },
  { code: 3, label: 'Orman ve Yarı Doğal Alanlar', color: LAND_COVER_COLOR_BY_CODE[3] },
  { code: 4, label: 'Sulak Alanlar', color: LAND_COVER_COLOR_BY_CODE[4] },
  { code: 5, label: 'Su Kütleleri', color: LAND_COVER_COLOR_BY_CODE[5] },
] as const

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

function getLandCoverFillColorExpression(): ExpressionSpecification {
  return [
    'match',
    ['coalesce', ['to-number', ['get', 'LEVEL1']], ['to-number', ['get', 'level1']], ['to-number', ['get', 'code_18']], -1],
    1,
    LAND_COVER_COLOR_BY_CODE[1],
    2,
    LAND_COVER_COLOR_BY_CODE[2],
    3,
    LAND_COVER_COLOR_BY_CODE[3],
    4,
    LAND_COVER_COLOR_BY_CODE[4],
    5,
    LAND_COVER_COLOR_BY_CODE[5],
    LAND_COVER_FALLBACK_COLOR,
  ] as ExpressionSpecification
}

function getLayerOpacity(definition: OverlayLayerDefinition, layerState: OverlayLayerState): number {
  return definition.id === LAND_COVER_LAYER_ID ? 1 : layerState.opacity
}

async function fetchGeoJsonFromUrl(url: string): Promise<FeatureCollection<Geometry>> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GeoJSON indirilemedi (${response.status})`)
  }

  const data = await response.json()
  return normalizeFeatureCollection(data)
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
        'fill-color': definition.id === LAND_COVER_LAYER_ID ? getLandCoverFillColorExpression() : layerState.color,
        'fill-opacity': getLayerOpacity(definition, layerState),
      },
    })
  }

  if (definition.type === 'fill' && !map.getLayer(`${definition.id}-outline`)) {
    map.addLayer({
      id: `${definition.id}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': definition.id === LAND_COVER_LAYER_ID ? getLandCoverFillColorExpression() : '#000000',
        'line-width': 1,
        'line-opacity': definition.id === LAND_COVER_LAYER_ID ? 1 : 0.5,
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
    map.setPaintProperty(
      definition.id,
      'fill-color',
      definition.id === LAND_COVER_LAYER_ID ? getLandCoverFillColorExpression() : layerState.color,
    )
    map.setPaintProperty(definition.id, 'fill-opacity', getLayerOpacity(definition, layerState))
  }

  if (definition.type === 'fill' && map.getLayer(`${definition.id}-outline`)) {
    map.setPaintProperty(
      `${definition.id}-outline`,
      'line-color',
      definition.id === LAND_COVER_LAYER_ID ? getLandCoverFillColorExpression() : '#000000',
    )
    map.setPaintProperty(`${definition.id}-outline`, 'line-opacity', definition.id === LAND_COVER_LAYER_ID ? 1 : 0.5)
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const layerStatesRef = useRef(layerStates)
  const cacheRef = useRef(new globalThis.Map<string, FeatureCollection<Geometry>>())
  const qrInitAppliedRef = useRef(false)

  useEffect(() => {
    layerStatesRef.current = layerStates
  }, [layerStates])

  useEffect(() => {
    if (!mapInstance || qrInitAppliedRef.current) return

    const params = new URLSearchParams(window.location.search)
    const pathname = window.location.pathname.toLowerCase()
    // Kısa URL örnekleri:
    // https://ogmmateryal.eba.gov.tr/cbs/lc2018
    // https://ogmmateryal.eba.gov.tr/cbs/arazi-ortusu-2018
    const isLandCoverPresetPath = pathname.endsWith('/cbs/lc2018') || pathname.endsWith('/cbs/arazi-ortusu-2018')
    const shouldOpenLandCover = params.get('landCover') === '1'
    if (!shouldOpenLandCover && !isLandCoverPresetPath) return

    const opacityFromUrl = Number(params.get('landCoverOpacity') ?? 100)
    const normalizedOpacity = Number.isFinite(opacityFromUrl)
      ? Math.min(100, Math.max(0, opacityFromUrl)) / 100
      : 1

    qrInitAppliedRef.current = true
    setLayerOpacity(LAND_COVER_LAYER_ID, normalizedOpacity)
    void toggleLayer(LAND_COVER_LAYER_ID, true)
  }, [mapInstance])

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
    setErrorMessage(null)
    try {
      if (!definition.url && !definition.file) {
        throw new Error(`Katman kaynağı tanımlı değil (${definition.id})`)
      }
      const normalized = definition.url
        ? await fetchGeoJsonFromUrl(definition.url)
        : normalizeFeatureCollection(await shp(`${OVERLAY_LAYER_BASE_URL}${definition.file!}`))
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
      setErrorMessage(`${definition.name} katmanı yüklenemedi. Lütfen bağlantınızı kontrol edin.`)
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
    errorMessage,
    clearErrorMessage: () => setErrorMessage(null),
    isLandCoverLegendVisible: Boolean(layerStates[LAND_COVER_LAYER_ID]?.enabled),
  }
}
