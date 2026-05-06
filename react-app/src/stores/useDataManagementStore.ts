import { create } from 'zustand'

import type { DataItem, DataManagementStore, LayerStyles, NewDataItem } from '@/features/data-management'
import { useClusteringStore } from '@/stores/useClusteringStore'

export type { DataItem }


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

export const useDataManagementStore = create<DataManagementStore>()((set, get) => ({
  items: [],
  activeItemId: null,
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
    }
  }),

  removeItem: (id) => set((state) => {
    const nextItems = state.items.filter(i => i.id !== id)
    const stillHasImported = nextItems.some(item => item.source === 'imported')
    return {
      items: nextItems,
      hasImportedData: stillHasImported,
      importedLayerName: stillHasImported ? state.importedLayerName : null,
      activeItemId: state.activeItemId === id ? null : state.activeItemId,
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
  toggleImportedSourceVisibility: (sourceLabel) => set((state) => {
    const sourceItems = state.items.filter(item => item.source === 'imported' && item.sourceLabel === sourceLabel)
    const nextVisible = sourceItems.some(item => !item.visible)
    return {
      items: state.items.map(item =>
        item.source === 'imported' && item.sourceLabel === sourceLabel
          ? { ...item, visible: nextVisible }
          : item,
      ),
    }
  }),

  setActiveItem: (id) => set({ activeItemId: id }),
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
  setFabPosition: (position) => set({ fabPosition: position }),

  clearAll: () => set({
    items: [],
    activeItemId: null,
    hasImportedData: false,
    importedLayerName: null,
    layerStyles: defaultLayerStyles,
  }),

  clearBufferAnalysisItems: () => set((state) => {
    const nextItems = state.items.filter(item => item.properties.analysis !== 'buffer')
    const activeItemStillExists = state.activeItemId
      ? nextItems.some(item => item.id === state.activeItemId)
      : true

    return {
      items: nextItems,
      activeItemId: activeItemStillExists ? state.activeItemId : null,
      hasImportedData: nextItems.some(item => item.source === 'imported'),
      importedLayerName: nextItems.some(item => item.source === 'imported')
        ? state.importedLayerName
        : null,
    }
  }),

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
  }),
}))
