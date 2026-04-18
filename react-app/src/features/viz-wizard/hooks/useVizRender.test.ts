import { act, renderHook, waitFor } from '@testing-library/react'
import type maplibregl from 'maplibre-gl'
import toast from 'react-hot-toast'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useVisualizationStore } from '@/stores/useVisualizationStore'
import type { MatchResults, VisualizationSettings } from '@/types/visualization'

import { useVizRender } from './useVizRender'

const clearVisualizationMock = vi.fn()
const renderBubbleMock = vi.fn()
const renderChoroplethMock = vi.fn()
const renderPointMock = vi.fn()
const updateDisplayOptionsMock = vi.fn()

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}))

vi.mock('@/shared/visualization', () => ({
  BUBBLE_DEFAULT_FILL_COLOR: '#3b82f6',
  DEFAULT_DOT_COLOR: '#2d6a4f',
  DEFAULT_DOT_OPACITY: 0.85,
  DEFAULT_DOT_SIZE: 2.4,
  buildZoomRadius: vi.fn((size: number) => size),
  VisualizationManager: vi.fn(),
  getVisualizationManager: vi.fn().mockImplementation(() => ({
    clearVisualization: clearVisualizationMock,
    renderBubble: renderBubbleMock,
    renderChoropleth: renderChoroplethMock,
    renderPoint: renderPointMock,
    updateDisplayOptions: updateDisplayOptionsMock,
  })),
}))

function createMapMock() {
  return {
    getLayer: vi.fn(() => ({ id: 'layer' })),
    setPaintProperty: vi.fn(),
  } as unknown as maplibregl.Map
}

const matchResults: MatchResults = {
  successful: [
    {
      rowIndex: 0,
      matched: true,
      ambiguous: false,
      location: 'Ankara',
      province: 'Ankara',
      value: 10,
      originalData: {
        city: 'Ankara',
        value: 10,
        color_metric: 4,
      },
    },
  ],
  ambiguous: [],
  failed: [],
}

const choroplethSettings: VisualizationSettings = {
  type: 'choropleth',
  classCount: 3,
  classificationMethod: 'custom',
  colorScheme: 'teal',
  customBreaks: [0, 10, 20, 30],
  legendType: 'discrete',
}

const equalIntervalSettings: VisualizationSettings = {
  type: 'choropleth',
  classCount: 3,
  classificationMethod: 'equal',
  colorScheme: 'teal',
  customBreaks: [0, 10, 20, 30],
  legendType: 'discrete',
}

const bubbleSettings: VisualizationSettings = {
  type: 'bubble',
  classCount: 5,
  classificationMethod: 'jenks',
  colorScheme: 'teal',
  colorColumn: 'color_metric',
  legendType: 'discrete',
  symbolOpacity: 0.7,
  symbolStrokeColor: '#ffffff',
  symbolStrokeWidth: 0.5,
}

const dotSettings: VisualizationSettings = {
  type: 'dot',
  classCount: 5,
  classificationMethod: 'jenks',
  colorScheme: 'teal',
  legendType: 'discrete',
  dotColor: '#2d6a4f',
  dotOpacity: 0.85,
  dotSize: 2.4,
}

describe('useVizRender regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useVisualizationStore.getState().reset()
  })

  it('re-renders when custom break values change after the first render', async () => {
    const map = createMapMock()

    useVisualizationStore.getState().setVizSettings(choroplethSettings)

    const initialProps = {
      columnMapping: {
        dataColumn: 'value',
        locationLevel: 'province' as const,
      },
      map,
      matchResults,
      vizSettings: useVisualizationStore.getState().vizSettings,
    }

    const { result, rerender } = renderHook((props: typeof initialProps) => useVizRender(props), {
      initialProps,
    })

    await act(async () => {
      await result.current.handleRender()
    })

    await waitFor(() => {
      expect(renderChoroplethMock).toHaveBeenCalledTimes(1)
      expect(result.current.hasRendered).toBe(true)
    })

    act(() => {
      useVisualizationStore.getState().setVizSettings({
        customBreaks: [0, 5, 25, 30],
      })
      rerender({
        ...initialProps,
        vizSettings: useVisualizationStore.getState().vizSettings,
      })
    })

    await waitFor(() => {
      expect(renderChoroplethMock).toHaveBeenCalledTimes(2)
    })
  })

  it('does not re-render when customBreaks change outside custom classification mode', async () => {
    const map = createMapMock()

    useVisualizationStore.getState().setVizSettings(equalIntervalSettings)

    const initialProps = {
      columnMapping: {
        dataColumn: 'value',
        locationLevel: 'province' as const,
      },
      map,
      matchResults,
      vizSettings: useVisualizationStore.getState().vizSettings,
    }

    const { result, rerender } = renderHook((props: typeof initialProps) => useVizRender(props), {
      initialProps,
    })

    await act(async () => {
      await result.current.handleRender()
    })

    await waitFor(() => {
      expect(renderChoroplethMock).toHaveBeenCalledTimes(1)
      expect(result.current.hasRendered).toBe(true)
    })

    act(() => {
      useVisualizationStore.getState().setVizSettings({
        customBreaks: [5, 15, 25, 35],
      })
      rerender({
        ...initialProps,
        vizSettings: useVisualizationStore.getState().vizSettings,
      })
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(renderChoroplethMock).toHaveBeenCalledTimes(1)
  })

  it('keeps bivariate bubble color expressions intact during paint-only updates', async () => {
    const map = createMapMock()

    useVisualizationStore.getState().setVizSettings(bubbleSettings)

    const initialProps = {
      columnMapping: {
        dataColumn: 'value',
        locationLevel: 'province' as const,
      },
      map,
      matchResults,
      vizSettings: useVisualizationStore.getState().vizSettings,
    }

    const { result, rerender } = renderHook((props: typeof initialProps) => useVizRender(props), {
      initialProps,
    })

    await act(async () => {
      await result.current.handleRender()
    })

    await waitFor(() => {
      expect(renderBubbleMock).toHaveBeenCalledTimes(1)
      expect(result.current.hasRendered).toBe(true)
    })

    act(() => {
      useVisualizationStore.getState().setVizSettings({
        symbolStrokeWidth: 2,
      })
      rerender({
        ...initialProps,
        vizSettings: useVisualizationStore.getState().vizSettings,
      })
    })

    await waitFor(() => {
      expect(map.setPaintProperty).toHaveBeenCalledWith('bubble-circles', 'circle-stroke-width', 2)
    })

    expect(map.setPaintProperty).not.toHaveBeenCalledWith(
      'bubble-circles',
      'circle-color',
      expect.anything(),
    )
  })

  it('normalizes bubble size and color columns before rendering and stores the normalized snapshot', async () => {
    const map = createMapMock()
    const normalizedMatchResults: MatchResults = {
      successful: [
        {
          rowIndex: 0,
          matched: true,
          ambiguous: false,
          location: 'Ankara',
          province: 'Ankara',
          value: 100,
          originalData: {
            city: 'Ankara',
            value: 100,
            color_metric: 50,
            population: 10,
          },
        },
      ],
      ambiguous: [],
      failed: [],
    }

    useVisualizationStore.getState().setVizSettings({
      ...bubbleSettings,
      normalization: 'field',
      normalizationField: 'population',
    })

    const { result } = renderHook(() =>
      useVizRender({
        columnMapping: {
          dataColumn: 'value',
          locationLevel: 'province',
        },
        map,
        matchResults: normalizedMatchResults,
        vizSettings: useVisualizationStore.getState().vizSettings,
      }),
    )

    await act(async () => {
      await result.current.handleRender()
    })

    await waitFor(() => {
      expect(renderBubbleMock).toHaveBeenCalledTimes(1)
    })

    expect(renderBubbleMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          location: 'Ankara',
          province: 'Ankara',
          city: 'Ankara',
          value: 10,
          color_metric: 5,
          population: 10,
        }),
      ],
      'value',
      expect.objectContaining({
        type: 'bubble',
        normalization: 'field',
        normalizationField: 'population',
        colorColumn: 'color_metric',
        valueLabelFormat: '0a',
      }),
      'province',
    )

    expect(useVisualizationStore.getState().currentVisualization).toEqual({
      type: 'bubble',
      column: 'value',
      locationLevel: 'province',
      data: [
        expect.objectContaining({
          location: 'Ankara',
          province: 'Ankara',
          city: 'Ankara',
          value: 10,
          color_metric: 5,
          population: 10,
        }),
      ],
      renderSettings: expect.objectContaining({
        type: 'bubble',
        normalization: 'field',
        normalizationField: 'population',
        colorColumn: 'color_metric',
        valueLabelFormat: '0a',
      }),
    })
  })

  it('routes dot visualization to the point renderer and stores the active snapshot', async () => {
    const map = createMapMock()

    useVisualizationStore.getState().setVizSettings(dotSettings)

    const { result } = renderHook(() =>
      useVizRender({
        columnMapping: {
          dataColumn: 'value',
          locationLevel: 'province',
        },
        map,
        matchResults,
        vizSettings: useVisualizationStore.getState().vizSettings,
      }),
    )

    await act(async () => {
      await result.current.handleRender()
    })

    await waitFor(() => {
      expect(renderPointMock).toHaveBeenCalledTimes(1)
      expect(result.current.hasRendered).toBe(true)
    })

    expect(renderPointMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          location: 'Ankara',
          province: 'Ankara',
          city: 'Ankara',
          value: 10,
        }),
      ],
      'value',
      expect.objectContaining({
        type: 'dot',
        dotColor: '#2d6a4f',
        dotOpacity: 0.85,
        dotSize: 2.4,
        valueLabelFormat: '0a',
      }),
      'province',
    )

    expect(useVisualizationStore.getState().currentVisualization).toEqual({
      type: 'dot',
      column: 'value',
      locationLevel: 'province',
      data: [
        expect.objectContaining({
          location: 'Ankara',
          province: 'Ankara',
          city: 'Ankara',
          value: 10,
        }),
      ],
      renderSettings: expect.objectContaining({
        type: 'dot',
        dotColor: '#2d6a4f',
        dotOpacity: 0.85,
        dotSize: 2.4,
        valueLabelFormat: '0a',
      }),
    })
  })

  it('applies display-only updates to the active rendered type without auto-switching visualization type', async () => {
    const map = createMapMock()

    useVisualizationStore.getState().setVizSettings(choroplethSettings)

    const initialProps = {
      columnMapping: {
        dataColumn: 'value',
        locationLevel: 'province' as const,
      },
      map,
      matchResults,
      vizSettings: useVisualizationStore.getState().vizSettings,
    }

    const { result, rerender } = renderHook((props: typeof initialProps) => useVizRender(props), {
      initialProps,
    })

    await act(async () => {
      await result.current.handleRender()
    })

    await waitFor(() => {
      expect(renderChoroplethMock).toHaveBeenCalledTimes(1)
      expect(result.current.hasRendered).toBe(true)
    })

    act(() => {
      useVisualizationStore.getState().setVizSettings({
        type: 'dot',
        showLabels: true,
        showValues: true,
        dataOnlyMode: true,
      })
      rerender({
        ...initialProps,
        vizSettings: useVisualizationStore.getState().vizSettings,
      })
    })

    await waitFor(() => {
      expect(updateDisplayOptionsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'choropleth',
          showLabels: true,
          showValues: true,
          dataOnlyMode: true,
        }),
      )
    })

    expect(renderChoroplethMock).toHaveBeenCalledTimes(1)
    expect(renderPointMock).not.toHaveBeenCalled()
    expect(useVisualizationStore.getState().currentVisualization.renderSettings).toEqual(
      expect.objectContaining({
        type: 'choropleth',
        showLabels: true,
        showValues: true,
        dataOnlyMode: true,
      }),
    )
  })

  it('surfaces a toast error when there is no map instance', async () => {
    useVisualizationStore.getState().setVizSettings(choroplethSettings)

    const { result } = renderHook(() =>
      useVizRender({
        columnMapping: {
          dataColumn: 'value',
          locationLevel: 'province',
        },
        map: null,
        matchResults,
        vizSettings: useVisualizationStore.getState().vizSettings,
      }),
    )

    await act(async () => {
      await result.current.handleRender()
    })

    expect(toast.error).toHaveBeenCalled()
  })
})
