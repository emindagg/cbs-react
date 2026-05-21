import { create } from 'zustand'

import type { DataItem, DataManagementStore, LayerStyles, NewDataItem } from '@/features/data-management'
import { useClusteringStore } from '@/stores/useClusteringStore'

export type { DataItem }

const uniqueIds = (ids: string[]) => [...new Set(ids)]

const selectedIdsAfterRemoval = (selectedItemIds: string[], removedIds: string[]) => {
  if (selectedItemIds.length === 0) return selectedItemIds
  const removed = new Set(removedIds)
  return selectedItemIds.filter(id => !removed.has(id))
}

/** ImportedDataManagerFab — Yüklü Veriler satır anahtarı ile uyumlu */
function importedSourceRowKey(item: DataItem) {
  return item.sourceLabel || item.name || 'Import edilen veri'
}

const defaultLayerStyles: LayerStyles = {
  clusterEnabled: false,
  opacity: 0.3,
  strokeOpacity: 1,
  width: 5,
  lineWidth: 2,
  fillColor: '#18181B',
  strokeWidth: 2,
  strokeColor: '#111111',
  labelField: '',
  textSize: 12,
  textColor: '#111827',
}

const createPersistedItem = (item: NewDataItem, source: 'drawn' | 'imported') => ({
  ...item,
  id: crypto.randomUUID(),
  visible: true,
  source,
})

const clonePoints = (points: [number, number][]): [number, number][] => (
  points.map(([lng, lat]) => [lng, lat])
)

const toEditableDrawState = (item: DataItem): { drawMode: 'line' | 'polygon'; drawPoints: [number, number][] } | null => {
  if (item.type === 'line' && item.geometry.type === 'LineString') {
    return {
      drawMode: 'line',
      drawPoints: clonePoints(item.geometry.coordinates as [number, number][]),
    }
  }

  if (item.type === 'polygon' && item.geometry.type === 'Polygon') {
    const ring = item.geometry.coordinates[0] as [number, number][]
    if (!ring || ring.length < 3) return null
    const first = ring[0]
    const last = ring[ring.length - 1]
    const isClosed = Boolean(first && last && first[0] === last[0] && first[1] === last[1])
    const openRing = clonePoints(isClosed ? ring.slice(0, -1) : ring)
    return {
      drawMode: 'polygon',
      drawPoints: openRing,
    }
  }

  return null
}

export const useDataManagementStore = create<DataManagementStore>()((set, get) => ({
  items: [],
  activeItemId: null,
  selectedItemIds: [],
  hasImportedData: false,
  importedLayerName: null,
  layerStyles: defaultLayerStyles,
  fabPosition: null,

  drawMode: 'none',
  drawPoints: [],
  drawGhostPoint: null,
  isDrawing: false,
  drawUndoStack: [],
  drawRedoStack: [],
  editingItemId: null,

  addItem: (item) => set((state) => ({
    items: [...state.items, createPersistedItem(item, 'drawn')],
  })),

  addItems: (items) => set((state) => {
    const importedItems = items.map(item => createPersistedItem(item, 'imported'))
    const nextItems = [...state.items, ...importedItems]
    const importedName = importedItems[0]?.name ?? state.importedLayerName

    return {
      items: nextItems,
      hasImportedData: nextItems.some(item => item.source === 'imported'),
      importedLayerName: importedName,
      activeItemId: state.activeItemId,
      selectedItemIds: state.selectedItemIds,
    }
  }),

  removeItem: (id) => set((state) => {
    const nextItems = state.items.filter(i => i.id !== id)
    const stillHasImported = nextItems.some(item => item.source === 'imported')
    const selectedItemIds = selectedIdsAfterRemoval(state.selectedItemIds, [id])
    return {
      items: nextItems,
      hasImportedData: stillHasImported,
      importedLayerName: stillHasImported ? state.importedLayerName : null,
      activeItemId: state.activeItemId === id ? null : state.activeItemId,
      selectedItemIds,
      editingItemId: state.editingItemId === id ? null : state.editingItemId,
    }
  }),

  toggleVisibility: (id) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, visible: !i.visible } : i),
  })),

  removeImportedLayer: () => set((state) => ({
    items: state.items.filter(item => item.source !== 'imported'),
    hasImportedData: false,
    importedLayerName: null,
    activeItemId: state.activeItemId && state.items.some(item => item.id === state.activeItemId && item.source === 'drawn')
      ? state.activeItemId
      : null,
    selectedItemIds: state.selectedItemIds.filter(id =>
      state.items.some(item => item.id === id && item.source === 'drawn'),
    ),
  })),

  toggleImportedLayerVisibility: () => set((state) => {
    const importedItems = state.items.filter(item => item.source === 'imported')
    const nextVisible = importedItems.some(item => !item.visible)
    return {
      items: state.items.map(item =>
        item.source === 'imported'
          ? { ...item, visible: nextVisible }
          : item,
      ),
    }
  }),
  toggleImportedSourceVisibility: (sourceKey) => set((state) => {
    const sourceItems = state.items.filter(
      item => item.source === 'imported' && importedSourceRowKey(item) === sourceKey,
    )
    const nextVisible = sourceItems.some(item => !item.visible)
    return {
      items: state.items.map(item =>
        item.source === 'imported' && importedSourceRowKey(item) === sourceKey
          ? { ...item, visible: nextVisible }
          : item,
      ),
    }
  }),

  setActiveItem: (id) => set((state) => ({
    activeItemId: id && state.items.some(item => item.id === id) ? id : null,
  })),
  clearActiveItem: () => set({ activeItemId: null }),
  setSelectedItems: (ids) => set((state) => {
    const existingIds = new Set(state.items.map(item => item.id))
    const selectedItemIds = uniqueIds(ids).filter(id => existingIds.has(id))
    return {
      selectedItemIds,
    }
  }),
  toggleSelectedItem: (id) => set((state) => {
    if (!state.items.some(item => item.id === id)) return state
    const exists = state.selectedItemIds.includes(id)
    const selectedItemIds = exists
      ? state.selectedItemIds.filter(selectedId => selectedId !== id)
      : [...state.selectedItemIds, id]
    return {
      selectedItemIds,
    }
  }),
  clearSelectedItems: () => set({ selectedItemIds: [] }),
  updateLayerStyle: (styles) => {
    const nextStyles = { ...get().layerStyles, ...styles }
    set({ layerStyles: nextStyles })

    if (Object.hasOwn(styles, 'clusterEnabled')) {
      const clusteringEnabled = useClusteringStore.getState().isEnabled
      if (nextStyles.clusterEnabled !== clusteringEnabled) {
        useClusteringStore.getState().toggle()
      }
    }
  },
  updateItemProperties: (id, properties) => set((state) => ({
    items: state.items.map(item =>
      item.id === id
        ? { ...item, properties: { ...item.properties, ...properties } }
        : item,
    ),
  })),

  updateItemFillColor: (id, fillColor) => set((state) => ({
    items: state.items.map(item =>
      item.id === id
        ? {
          ...item,
          properties: {
            ...item.properties,
            style: {
              ...(item.properties.style && typeof item.properties.style === 'object' ? item.properties.style : {}),
              fillColor,
            },
          },
        }
        : item,
    ),
  })),

  updateImportedSourceFillColor: (sourceKey, fillColor) => set((state) => ({
    items: state.items.map((item) => {
      if (item.source !== 'imported' || importedSourceRowKey(item) !== sourceKey) {
        return item
      }
      return {
        ...item,
        properties: {
          ...item.properties,
          style: {
            ...(item.properties.style && typeof item.properties.style === 'object' ? item.properties.style : {}),
            fillColor,
          },
        },
      }
    }),
  })),

  addPropertyColumn: (columnName, defaultValue = '', sourceFilter) => set((state) => ({
    items: state.items.map((item) => {
      if (sourceFilter && item.source !== sourceFilter) return item
      if (Object.hasOwn(item.properties, columnName)) return item

      return {
        ...item,
        properties: {
          ...item.properties,
          [columnName]: defaultValue,
        },
      }
    }),
  })),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item =>
      item.id === id
        ? { ...item, ...updates }
        : item,
    ),
  })),
  updateItemGeometry: (id, geometry) => set((state) => ({
    items: state.items.map(item =>
      item.id === id
        ? { ...item, geometry }
        : item,
    ),
  })),
  setFabPosition: (position) => set({ fabPosition: position }),

  clearAll: () => set({
    items: [],
    activeItemId: null,
    selectedItemIds: [],
    hasImportedData: false,
    importedLayerName: null,
    layerStyles: defaultLayerStyles,
    editingItemId: null,
  }),

  clearBufferAnalysisItems: () => set((state) => {
    const nextItems = state.items.filter(item => item.properties.analysis !== 'buffer')
    const activeItemStillExists = state.activeItemId
      ? nextItems.some(item => item.id === state.activeItemId)
      : true

    return {
      items: nextItems,
      activeItemId: activeItemStillExists ? state.activeItemId : null,
      selectedItemIds: state.selectedItemIds.filter(id => nextItems.some(item => item.id === id)),
      hasImportedData: nextItems.some(item => item.source === 'imported'),
      importedLayerName: nextItems.some(item => item.source === 'imported')
        ? state.importedLayerName
        : null,
      editingItemId: state.editingItemId && nextItems.some(item => item.id === state.editingItemId)
        ? state.editingItemId
        : null,
    }
  }),
  startEditingItem: (id) => set((state) => {
    const item = state.items.find(entry => entry.id === id)
    if (!item) return state
    const drawState = toEditableDrawState(item)
    if (!drawState) return state

    return {
      editingItemId: id,
      drawMode: drawState.drawMode,
      drawPoints: drawState.drawPoints,
      drawGhostPoint: null,
      isDrawing: false,
      drawUndoStack: [],
      drawRedoStack: [],
    }
  }),
  stopEditingItem: () => set({ editingItemId: null }),

  updateDrawPoint: (index, point) => set((state) => {
    const next = clonePoints(state.drawPoints)
    const currentPoint = next[index]
    if (!currentPoint || (currentPoint[0] === point[0] && currentPoint[1] === point[1])) {
      return state
    }

    next[index] = point
    return {
      drawPoints: next,
      drawUndoStack: [...state.drawUndoStack, clonePoints(state.drawPoints)],
      drawRedoStack: [],
    }
  }),
  setDrawMode: (mode) => set((state) => {
    if (mode !== state.drawMode) {
      return {
        drawMode: mode,
        drawPoints: [],
        drawGhostPoint: null,
        isDrawing: mode !== 'none',
        drawUndoStack: [],
        drawRedoStack: [],
      }
    }
    return { drawMode: mode }
  }),
  setDrawPoints: (points) => set((state) => ({
    drawPoints: points,
    drawUndoStack: [...state.drawUndoStack, clonePoints(state.drawPoints)],
    drawRedoStack: [],
  })),
  setDrawGhostPoint: (point) => set({ drawGhostPoint: point }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  undoDraw: () => set((state) => {
    if (state.drawUndoStack.length === 0 || state.drawMode === 'none') {
      return state
    }

    const previousPoints = state.drawUndoStack[state.drawUndoStack.length - 1]
    const nextUndoStack = state.drawUndoStack.slice(0, -1)

    return {
      drawPoints: clonePoints(previousPoints),
      drawUndoStack: nextUndoStack,
      drawRedoStack: [...state.drawRedoStack, clonePoints(state.drawPoints)],
      drawGhostPoint: null,
      isDrawing: state.drawMode === 'point' ? previousPoints.length === 0 : state.isDrawing,
    }
  }),
  redoDraw: () => set((state) => {
    if (state.drawRedoStack.length === 0 || state.drawMode === 'none') {
      return state
    }

    const nextPoints = state.drawRedoStack[state.drawRedoStack.length - 1]
    const nextRedoStack = state.drawRedoStack.slice(0, -1)

    return {
      drawPoints: clonePoints(nextPoints),
      drawUndoStack: [...state.drawUndoStack, clonePoints(state.drawPoints)],
      drawRedoStack: nextRedoStack,
      drawGhostPoint: null,
      isDrawing: state.drawMode === 'point' ? nextPoints.length === 0 : state.isDrawing,
    }
  }),
  resetDraw: () => set({
    drawPoints: [],
    drawGhostPoint: null,
    isDrawing: false,
    drawMode: 'none',
    drawUndoStack: [],
    drawRedoStack: [],
    editingItemId: null,
  }),
}))
