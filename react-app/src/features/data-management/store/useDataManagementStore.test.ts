import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DataItem } from '../types'
import { useDataManagementStore } from './useDataManagementStore'

vi.mock('./indexedDbStorage', () => ({
  indexedDbStorage: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

const pointGeometry: DataItem['geometry'] = {
  type: 'Point',
  coordinates: [29.0, 41.0],
}

function createItem(overrides: Partial<DataItem>): DataItem {
  return {
    id: 'item-id',
    name: 'Item',
    type: 'point',
    geometry: pointGeometry,
    properties: {},
    visible: true,
    source: 'drawn',
    ...overrides,
  }
}

describe('useDataManagementStore clearBufferAnalysisItems', () => {
  beforeEach(() => {
    useDataManagementStore.setState({
      items: [],
      activeItemId: null,
      selectedItemIds: [],
      hasImportedData: false,
      importedLayerName: null,
    })
  })

  it('removes only buffer-analysis items and clears active selection if removed', () => {
    const bufferItem = createItem({
      id: 'buffer-1',
      name: 'Buffer 1',
      type: 'polygon',
      properties: { analysis: 'buffer' },
    })
    const drawnItem = createItem({
      id: 'drawn-1',
      name: 'Drawn 1',
      properties: { custom: true },
    })
    const importedItem = createItem({
      id: 'imported-1',
      name: 'Imported 1',
      source: 'imported',
    })

    useDataManagementStore.setState({
      items: [bufferItem, drawnItem, importedItem],
      activeItemId: 'buffer-1',
      selectedItemIds: ['buffer-1', 'drawn-1'],
      hasImportedData: true,
      importedLayerName: 'Imported Layer',
    })

    useDataManagementStore.getState().clearBufferAnalysisItems()

    const state = useDataManagementStore.getState()
    expect(state.items.map(item => item.id)).toEqual(['drawn-1', 'imported-1'])
    expect(state.activeItemId).toBeNull()
    expect(state.selectedItemIds).toEqual(['drawn-1'])
    expect(state.hasImportedData).toBe(true)
    expect(state.importedLayerName).toBe('Imported Layer')
  })

  it('updateImportedSourceFillColor sets fill on all items matching source row key', () => {
    const a = createItem({
      id: 'a',
      name: 'P1',
      source: 'imported',
      sourceLabel: 'okul.geojson',
    })
    const b = createItem({
      id: 'b',
      name: 'P2',
      source: 'imported',
      sourceLabel: 'okul.geojson',
    })
    const c = createItem({
      id: 'c',
      name: 'P3',
      source: 'imported',
      sourceLabel: 'hastane.geojson',
    })

    useDataManagementStore.setState({
      items: [a, b, c],
      hasImportedData: true,
      importedLayerName: 'okul.geojson',
    })

    useDataManagementStore.getState().updateImportedSourceFillColor('okul.geojson', '#ff0000')

    const state = useDataManagementStore.getState()
    const styleA = state.items.find(i => i.id === 'a')?.properties.style as { fillColor?: string }
    const styleB = state.items.find(i => i.id === 'b')?.properties.style as { fillColor?: string }
    const styleC = state.items.find(i => i.id === 'c')?.properties.style as { fillColor?: string }
    expect(styleA?.fillColor).toBe('#ff0000')
    expect(styleB?.fillColor).toBe('#ff0000')
    expect(styleC?.fillColor).toBeUndefined()
  })

  it('keeps active selection when selected item is not buffer and updates imported flags', () => {
    const bufferItem = createItem({
      id: 'buffer-2',
      name: 'Buffer 2',
      type: 'polygon',
      properties: { analysis: 'buffer' },
    })
    const regularItem = createItem({
      id: 'regular-1',
      name: 'Regular 1',
      properties: { foo: 'bar' },
    })

    useDataManagementStore.setState({
      items: [bufferItem, regularItem],
      activeItemId: 'regular-1',
      selectedItemIds: ['buffer-2', 'regular-1'],
      hasImportedData: false,
      importedLayerName: 'Should Clear',
    })

    useDataManagementStore.getState().clearBufferAnalysisItems()

    const state = useDataManagementStore.getState()
    expect(state.items.map(item => item.id)).toEqual(['regular-1'])
    expect(state.activeItemId).toBe('regular-1')
    expect(state.selectedItemIds).toEqual(['regular-1'])
    expect(state.hasImportedData).toBe(false)
    expect(state.importedLayerName).toBeNull()
  })

  it('sets unique selected items without changing active map highlight', () => {
    const first = createItem({ id: 'first' })
    const second = createItem({ id: 'second' })

    useDataManagementStore.setState({ items: [first, second], activeItemId: 'first' })

    useDataManagementStore.getState().setSelectedItems(['second', 'second', 'missing', 'first'])

    const state = useDataManagementStore.getState()
    expect(state.selectedItemIds).toEqual(['second', 'first'])
    expect(state.activeItemId).toBe('first')
  })

  it('clears removed item ids from table-map selection state', () => {
    const first = createItem({ id: 'first' })
    const second = createItem({ id: 'second' })

    useDataManagementStore.setState({
      items: [first, second],
      activeItemId: 'first',
      selectedItemIds: ['first', 'second'],
    })

    useDataManagementStore.getState().removeItem('first')

    const state = useDataManagementStore.getState()
    expect(state.selectedItemIds).toEqual(['second'])
    expect(state.activeItemId).toBeNull()
  })
})

