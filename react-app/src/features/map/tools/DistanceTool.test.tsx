import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useToolStore } from '@/stores/useToolStore'

const mapMock = {
  on: vi.fn(),
  off: vi.fn(),
  getCanvas: vi.fn(() => ({ style: { cursor: '' } })),
  getSource: vi.fn(() => undefined),
}

vi.mock('react-map-gl/maplibre', () => ({
  useMap: () => ({ current: mapMock }),
  Source: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Layer: () => null,
  Marker: ({
    children,
    longitude,
    latitude,
    onClick,
  }: {
    children: React.ReactNode
    longitude: number
    latitude: number
    onClick?: (e: { originalEvent: Event }) => void
  }) => (
    <button
      type="button"
      data-testid={`marker-${longitude}-${latitude}`}
      onClick={() => {
        const originalEvent = { stopPropagation: vi.fn() } as unknown as Event
        onClick?.({ originalEvent })
      }}
    >
      {children}
    </button>
  ),
}))

import DistanceTool from './DistanceTool'

function resetToolStore() {
  useToolStore.setState({
    activeTool: 'measure-distance',
    distancePoints: [],
    isDrawingDistance: false,
    showMeasurementTools: true,
    showAdvancedAnalysis: true,
    toolsMenuMode: 'closed',
  })
}

describe('DistanceTool interaction behavior', () => {
  beforeEach(() => {
    resetToolStore()
    mapMock.on.mockClear()
    mapMock.off.mockClear()
    mapMock.getSource.mockClear()
  })

  it('inserts a new vertex when midpoint is clicked', () => {
    useToolStore.setState({
      distancePoints: [[0, 0], [2, 0], [4, 0]],
      isDrawingDistance: false,
    })

    render(<DistanceTool />)

    fireEvent.click(screen.getByTestId('marker-1-0'))

    expect(useToolStore.getState().distancePoints).toEqual([[0, 0], [1, 0], [2, 0], [4, 0]])
    expect(useToolStore.getState().isDrawingDistance).toBe(false)
  })

  it('continues drawing when last vertex is clicked after finishing a line', () => {
    useToolStore.setState({
      distancePoints: [[0, 0], [2, 0], [4, 0]],
      isDrawingDistance: false,
    })

    render(<DistanceTool />)

    fireEvent.click(screen.getByTestId('marker-4-0'))

    expect(useToolStore.getState().isDrawingDistance).toBe(true)
  })

  it('does not reopen drawing from last vertex when shape is closed', () => {
    useToolStore.setState({
      distancePoints: [[0, 0], [2, 0], [4, 0], [0, 0]],
      isDrawingDistance: false,
    })

    render(<DistanceTool />)

    fireEvent.click(screen.getAllByTestId('marker-0-0')[1])

    expect(useToolStore.getState().isDrawingDistance).toBe(false)
  })
})
