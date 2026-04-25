import type maplibregl from 'maplibre-gl'
import { vi } from 'vitest'

type StoredLayer = {
  id: string
  type: string
  source?: string
  filter?: unknown
  layout?: Record<string, unknown>
  paint: Record<string, unknown>
  before?: string
}

type StoredSource = {
  type: 'geojson'
  data: unknown
  setData: ReturnType<typeof vi.fn>
}

export function createMapMock() {
  const layers = new Map<string, StoredLayer>()
  const sources = new Map<string, StoredSource>()

  const addSource = vi.fn((id: string, source: { type: 'geojson'; data: unknown }) => {
    const storedSource: StoredSource = {
      type: source.type,
      data: source.data,
      setData: vi.fn((nextData: unknown) => {
        storedSource.data = nextData
      }),
    }
    sources.set(id, storedSource)
  })

  const addLayer = vi.fn((layer: {
    id: string
    type: string
    source?: string
    filter?: unknown
    layout?: Record<string, unknown>
    paint?: Record<string, unknown>
  }, before?: string) => {
    layers.set(layer.id, {
      id: layer.id,
      type: layer.type,
      source: layer.source,
      filter: layer.filter,
      layout: layer.layout,
      paint: { ...(layer.paint ?? {}) },
      before,
    })
  })

  const setFilter = vi.fn((layerId: string, filter: unknown) => {
    const layer = layers.get(layerId)
    if (!layer) return
    layer.filter = filter
  })

  const setPaintProperty = vi.fn((layerId: string, property: string, value: unknown) => {
    const layer = layers.get(layerId)
    if (!layer) return
    layer.paint[property] = value
  })

  const setLayoutProperty = vi.fn((layerId: string, property: string, value: unknown) => {
    const layer = layers.get(layerId)
    if (!layer) return
    layer.layout = { ...(layer.layout ?? {}), [property]: value }
  })

  const removeLayer = vi.fn((layerId: string) => {
    layers.delete(layerId)
  })

  const removeSource = vi.fn((sourceId: string) => {
    sources.delete(sourceId)
  })

  const moveLayer = vi.fn()

  const map = {
    addLayer,
    addSource,
    getLayer: vi.fn((layerId: string) => layers.get(layerId)),
    getSource: vi.fn((sourceId: string) => sources.get(sourceId)),
    moveLayer,
    removeLayer,
    removeSource,
    setFilter,
    setLayoutProperty,
    setPaintProperty,
  } as unknown as maplibregl.Map

  return {
    map,
    layers,
    sources,
    addLayer,
    addSource,
    moveLayer,
    removeLayer,
    removeSource,
    setFilter,
    setLayoutProperty,
    setPaintProperty,
  }
}
