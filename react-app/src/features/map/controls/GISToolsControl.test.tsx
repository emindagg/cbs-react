import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useClusteringStore } from '@/stores/useClusteringStore'
import { useToolStore } from '@/stores/useToolStore'

vi.mock('react-map-gl/maplibre', () => ({
  useMap: () => ({ current: null }),
}))

vi.mock('../../data-management/store/indexedDbStorage', () => ({
  indexedDbStorage: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'
import { BUFFER_MODE_COLORS } from './GISToolsControl.bufferColors'
import GISToolsControl from './GISToolsControl'

function resetStores() {
  useToolStore.setState({
    activeTool: 'none',
    distancePoints: [],
    distanceGhostPoint: null,
    isDrawingDistance: false,
    toolsMenuMode: 'closed',
  })
  useClusteringStore.setState({ isEnabled: false })
  useDataManagementStore.setState({
    items: [],
    activeItemId: null,
    hasImportedData: false,
    importedLayerName: null,
    drawMode: 'none',
    drawPoints: [],
    drawGhostPoint: null,
    isDrawing: false,
  })
}

function openIconsOnlyMenu(container: HTMLElement) {
  const toggleButton = container.querySelector('#toggle-gis-tools')
  expect(toggleButton).not.toBeNull()
  fireEvent.click(toggleButton as HTMLButtonElement) // closed -> full
  fireEvent.click(toggleButton as HTMLButtonElement) // full -> icons-only
}

describe('GISToolsControl buffer toggle behavior', () => {
  beforeEach(() => {
    resetStores()
  })

  it('opens modal on first buffer click and closes + cleans all buffer items on second click', async () => {
    useDataManagementStore.setState({
      items: [
        {
          id: 'src-1',
          name: 'Kaynak Katman',
          type: 'point',
          geometry: { type: 'Point', coordinates: [29, 41] },
          properties: {},
          visible: true,
          source: 'drawn',
        },
      ],
    })

    const { container } = render(<GISToolsControl />)
    openIconsOnlyMenu(container)

    const bufferButton = screen.getByTitle(/Etki Alan/i)
    fireEvent.click(bufferButton)
    expect(screen.getByText(/Etki Alan/i)).toBeInTheDocument()

    fireEvent.click(bufferButton)

    await waitFor(() => {
      expect(screen.queryByText(/Etki Alan/i)).not.toBeInTheDocument()
    })

    const remainingIds = useDataManagementStore.getState().items.map(item => item.id)
    expect(remainingIds).toEqual(['src-1'])
  })

  it('closes modal from cancel without clearing non-buffer items', async () => {
    useDataManagementStore.setState({
      items: [
        {
          id: 'src-2',
          name: 'Kaynak 2',
          type: 'point',
          geometry: { type: 'Point', coordinates: [29.2, 41.2] },
          properties: { foo: 'bar' },
          visible: true,
          source: 'drawn',
        },
      ],
    })

    const { container } = render(<GISToolsControl />)
    openIconsOnlyMenu(container)

    fireEvent.click(screen.getByTitle(/Etki Alan/i))
    expect(screen.getByText(/Etki Alan/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /ptal/i }))

    await waitFor(() => {
      expect(screen.queryByText(/Etki Alan/i)).not.toBeInTheDocument()
    })

    expect(useDataManagementStore.getState().items.map(item => item.id)).toEqual(['src-2'])
  })

  it('clears existing buffer items on click without reopening modal', () => {
    useDataManagementStore.setState({
      items: [
        {
          id: 'src-3',
          name: 'Kaynak 3',
          type: 'point',
          geometry: { type: 'Point', coordinates: [29.3, 41.3] },
          properties: {},
          visible: true,
          source: 'drawn',
        },
        {
          id: 'buffer-3',
          name: 'Buffer 3',
          type: 'polygon',
          geometry: {
            type: 'Polygon',
            coordinates: [[[29.3, 41.3], [29.31, 41.3], [29.31, 41.31], [29.3, 41.3]]],
          },
          properties: { analysis: 'buffer' },
          visible: true,
          source: 'drawn',
        },
      ],
    })

    const { container } = render(<GISToolsControl />)
    openIconsOnlyMenu(container)

    fireEvent.click(screen.getByTitle(/Etki Alan/i))

    expect(screen.queryByText(/Etki Alan/i)).not.toBeInTheDocument()
    expect(useDataManagementStore.getState().items.map(item => item.id)).toEqual(['src-3'])
  })

  it('applies single-select modes with requested colors', () => {
    useDataManagementStore.setState({
      items: [
        {
          id: 'src-4',
          name: 'Kaynak 4',
          type: 'point',
          geometry: { type: 'Point', coordinates: [29.4, 41.4] },
          properties: {},
          visible: true,
          source: 'drawn',
        },
        {
          id: 'buffer-4a',
          name: 'Buffer 4A',
          type: 'polygon',
          geometry: {
            type: 'Polygon',
            coordinates: [[[29.4, 41.4], [29.42, 41.4], [29.42, 41.42], [29.4, 41.42], [29.4, 41.4]]],
          },
          properties: { analysis: 'buffer' },
          visible: true,
          source: 'drawn',
        },
        {
          id: 'buffer-4b',
          name: 'Buffer 4B',
          type: 'polygon',
          geometry: {
            type: 'Polygon',
            coordinates: [[[29.41, 41.41], [29.43, 41.41], [29.43, 41.43], [29.41, 41.43], [29.41, 41.41]]],
          },
          properties: { analysis: 'buffer' },
          visible: true,
          source: 'drawn',
        },
      ],
    })

    render(<GISToolsControl />)

    const optionsButton = screen.getByRole('button', { name: /Analiz Se/i })
    fireEvent.click(optionsButton)

    fireEvent.click(screen.getByRole('button', { name: /Birle/i }))
    expect(screen.getByRole('button', { name: /Birle/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Normal/i })).toHaveAttribute('aria-pressed', 'false')

    const stateAfterCombined = useDataManagementStore.getState()
    const combinedLayer = stateAfterCombined.items.find(
      item => item.properties.bufferDerivedType === 'combined',
    )
    expect(combinedLayer).toBeDefined()
    expect((combinedLayer?.properties as Record<string, unknown>).style).toMatchObject({
      fillColor: BUFFER_MODE_COLORS.combined,
    })
    expect(stateAfterCombined.items.find(item => item.id === 'buffer-4a')?.visible).toBe(false)
    expect(stateAfterCombined.items.find(item => item.id === 'buffer-4b')?.visible).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /Normal/i }))
    const stateAfterNormal = useDataManagementStore.getState()
    expect((stateAfterNormal.items.find(item => item.id === 'buffer-4a')?.properties as Record<string, unknown>).style).toMatchObject({
      fillColor: BUFFER_MODE_COLORS.normal,
    })
    expect((stateAfterNormal.items.find(item => item.id === 'buffer-4b')?.properties as Record<string, unknown>).style).toMatchObject({
      fillColor: BUFFER_MODE_COLORS.normal,
    })

    fireEvent.click(screen.getByRole('button', { name: /Kesi/i }))
    const stateAfterIntersection = useDataManagementStore.getState()
    const intersectionLayer = stateAfterIntersection.items.find(
      item => item.properties.bufferDerivedType === 'intersection',
    )
    expect(intersectionLayer).toBeDefined()
    expect((intersectionLayer?.properties as Record<string, unknown>).style).toMatchObject({
      fillColor: BUFFER_MODE_COLORS.intersection,
    })

    fireEvent.click(screen.getByRole('button', { name: /Fark/i }))
    const stateAfterDifference = useDataManagementStore.getState()
    const differenceLayer = stateAfterDifference.items.find(
      item => item.properties.bufferDerivedType === 'difference',
    )
    expect(differenceLayer).toBeDefined()
    expect((differenceLayer?.properties as Record<string, unknown>).style).toMatchObject({
      fillColor: BUFFER_MODE_COLORS.difference,
    })

    fireEvent.click(screen.getByRole('button', { name: /statistiksel/i }))
    expect(screen.getByRole('button', { name: /Fark/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /statistiksel/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Toplam Alan/i)).toBeInTheDocument()
  })

  it('closes modal after successful analyze and clears on next buffer click', async () => {
    useDataManagementStore.setState({
      items: [
        {
          id: 'point-1',
          name: 'Nokta 1',
          type: 'point',
          geometry: { type: 'Point', coordinates: [29, 41] },
          properties: {},
          visible: true,
          source: 'drawn',
        },
      ],
    })

    const { container } = render(<GISToolsControl />)
    openIconsOnlyMenu(container)

    fireEvent.click(screen.getByTitle(/Etki Alan/i))
    expect(screen.getByText(/Etki Alan/i)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Nokta 1'))
    fireEvent.click(screen.getByRole('button', { name: /Analiz Yap/i }))

    await waitFor(() => {
      expect(screen.queryByText(/Etki Alan/i)).not.toBeInTheDocument()
    })

    const hasBufferResult = useDataManagementStore
      .getState()
      .items.some(item => item.properties.analysis === 'buffer')

    expect(hasBufferResult).toBe(true)
    expect(screen.getByRole('button', { name: /Analiz Se/i })).toBeInTheDocument()

    fireEvent.click(screen.getByTitle(/Etki Alan/i))

    expect(screen.queryByText(/Etki Alan/i)).not.toBeInTheDocument()
    const hasBufferAfterClear = useDataManagementStore
      .getState()
      .items.some(item => item.properties.analysis === 'buffer')
    expect(hasBufferAfterClear).toBe(false)
  })
})
