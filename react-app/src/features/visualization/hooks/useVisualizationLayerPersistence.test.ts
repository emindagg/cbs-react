import { renderHook, waitFor } from '@testing-library/react'
import type maplibregl from 'maplibre-gl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import type { VisualizationSettings } from '@/types/visualization'

import { useVisualizationLayerPersistence } from './useVisualizationLayerPersistence'

const renderChoroplethMock = vi.fn()
const renderPointMock = vi.fn()
const renderBubbleMock = vi.fn()

vi.mock('../shared/VisualizationManager', () => ({
  VisualizationManager: vi.fn(),
  getVisualizationManager: vi.fn().mockImplementation(() => ({
    renderChoropleth: renderChoroplethMock,
    renderPoint: renderPointMock,
    renderBubble: renderBubbleMock,
  })),
}))

type StyleHandler = () => void

function createMapMock() {
  const handlers = new Set<StyleHandler>()
  let styleLoaded = true

  return {
    on: vi.fn((event: string, handler: StyleHandler) => {
      if (event === 'styledata') handlers.add(handler)
    }),
    off: vi.fn((event: string, handler: StyleHandler) => {
      if (event === 'styledata') handlers.delete(handler)
    }),
    isStyleLoaded: vi.fn(() => styleLoaded),
    getLayer: vi.fn(() => undefined),
    triggerStyleData: () => {
      handlers.forEach((handler) => handler())
    },
    setStyleLoaded: (value: boolean) => {
      styleLoaded = value
    },
  }
}

const validSettings: VisualizationSettings = {
  type: 'choropleth',
  classCount: 5,
  classificationMethod: 'equal',
  colorScheme: 'greenBlue',
  legendType: 'discrete',
}

describe('useVisualizationLayerPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMapStore.setState({
      isLoaded: false,
      zoom: 6,
      center: [35.2433, 38.9637],
      activeBasemap: 'CARTO_LIGHT',
      mapInstance: null,
    })
    useVisualizationStore.setState({
      currentVisualization: {
        type: null,
        data: null,
        column: null,
        locationLevel: null,
        renderSettings: null,
      },
      isVisualizationRenderInProgress: false,
    })
  })

  it('does not rehydrate before style is fully loaded', () => {
    const map = createMapMock()
    map.setStyleLoaded(false)

    useMapStore.setState({ mapInstance: map as unknown as maplibregl.Map })
    useVisualizationStore.setState({
      currentVisualization: {
        type: 'choropleth',
        data: [{ location: 'Ankara', value: 10 }],
        column: 'value',
        locationLevel: 'province',
        renderSettings: validSettings,
      },
    })

    renderHook(() => useVisualizationLayerPersistence())
    map.triggerStyleData()

    expect(renderChoroplethMock).not.toHaveBeenCalled()
  })

  it('does not rehydrate when there is no active visualization snapshot', () => {
    const map = createMapMock()
    useMapStore.setState({ mapInstance: map as unknown as maplibregl.Map })

    renderHook(() => useVisualizationLayerPersistence())
    map.triggerStyleData()

    expect(renderChoroplethMock).not.toHaveBeenCalled()
    expect(renderPointMock).not.toHaveBeenCalled()
    expect(renderBubbleMock).not.toHaveBeenCalled()
  })

  it('rehydrates active visualization after styledata when layer is missing', async () => {
    const map = createMapMock()
    useMapStore.setState({ mapInstance: map as unknown as maplibregl.Map })
    useVisualizationStore.setState({
      currentVisualization: {
        type: 'choropleth',
        data: [{ location: 'Ankara', value: 10 }],
        column: 'value',
        locationLevel: 'province',
        renderSettings: validSettings,
      },
    })

    renderHook(() => useVisualizationLayerPersistence())
    map.triggerStyleData()

    await waitFor(() => {
      expect(renderChoroplethMock).toHaveBeenCalledTimes(1)
      expect(renderChoroplethMock).toHaveBeenCalledWith(
        [{ location: 'Ankara', value: 10 }],
        'value',
        validSettings,
        'province',
      )
    })
  })

  it('skips rehydrate during render transaction and resumes after it ends', async () => {
    const map = createMapMock()
    useMapStore.setState({ mapInstance: map as unknown as maplibregl.Map })
    useVisualizationStore.setState({
      currentVisualization: {
        type: 'choropleth',
        data: [{ location: 'Ankara', value: 10 }],
        column: 'value',
        locationLevel: 'province',
        renderSettings: validSettings,
      },
      isVisualizationRenderInProgress: true,
    })

    renderHook(() => useVisualizationLayerPersistence())

    map.triggerStyleData()
    expect(renderChoroplethMock).not.toHaveBeenCalled()

    useVisualizationStore.setState({ isVisualizationRenderInProgress: false })
    map.triggerStyleData()

    await waitFor(() => {
      expect(renderChoroplethMock).toHaveBeenCalledTimes(1)
    })
  })

  it('prevents duplicate rehydrate calls while previous rehydrate is in progress', async () => {
    let resolveRender: (() => void) | null = null
    renderChoroplethMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveRender = resolve
        }),
    )

    const map = createMapMock()
    useMapStore.setState({ mapInstance: map as unknown as maplibregl.Map })
    useVisualizationStore.setState({
      currentVisualization: {
        type: 'choropleth',
        data: [{ location: 'Ankara', value: 10 }],
        column: 'value',
        locationLevel: 'province',
        renderSettings: validSettings,
      },
    })

    renderHook(() => useVisualizationLayerPersistence())

    map.triggerStyleData()
    map.triggerStyleData()

    expect(renderChoroplethMock).toHaveBeenCalledTimes(1)

    resolveRender?.()

    await waitFor(() => {
      expect(renderChoroplethMock).toHaveBeenCalledTimes(1)
    })
  })
})
