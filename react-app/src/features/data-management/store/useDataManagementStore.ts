import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { useClusteringStore } from '@/stores/useClusteringStore'

import type { DataManagementStore, LayerStyles, NewDataItem } from '../types'
import { indexedDbStorage } from './indexedDbStorage'

const defaultLayerStyles: LayerStyles = {
  clusterEnabled: false,
  opacity: 0.9,
  width: 6,
  fillColor: '#3b82f6',
  strokeWidth: 1,
  strokeColor: '#000000',
  labelField: '',
  textSize: 12,
  textColor: '#111827',
}

const createPersistedItem = (item: NewDataItem, source: 'drawn' | 'imported') => ({
  ...item,
  id: uuidv4(),
  visible: true,
  source,
})

export const useDataManagementStore = create<DataManagementStore>()(persist((set, get) => ({
  items: [],
  activeItemId: null,
  hasImportedData: false,
  importedLayerName: null,
  layerStyles: defaultLayerStyles,
  fabPosition: null,

  drawMode: 'none',
  drawPoints: [],
  drawGhostPoint: null,
  drawCenter: null,
  drawRadius: null,
  isDrawing: false,

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
      activeItemId: importedItems[0]?.id ?? state.activeItemId,
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
  setFabPosition: (position) => set({ fabPosition: position }),

  clearAll: () => set({
    items: [],
    activeItemId: null,
    hasImportedData: false,
    importedLayerName: null,
    layerStyles: defaultLayerStyles,
  }),

  setDrawMode: (mode) => set((state) => {
    if (mode !== state.drawMode) {
      return {
        drawMode: mode,
        drawPoints: [],
        drawGhostPoint: null,
        drawCenter: null,
        drawRadius: null,
        isDrawing: mode !== 'none',
      }
    }
    return { drawMode: mode }
  }),
  setDrawPoints: (points) => set({ drawPoints: points }),
  setDrawGhostPoint: (point) => set({ drawGhostPoint: point }),
  setDrawCenter: (center) => set({ drawCenter: center }),
  setDrawRadius: (radius) => set({ drawRadius: radius }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  resetDraw: () => set({
    drawPoints: [],
    drawGhostPoint: null,
    drawCenter: null,
    drawRadius: null,
    isDrawing: false,
    drawMode: 'none',
  }),
}), {
  name: 'data-management-store',
  storage: createJSONStorage(() => indexedDbStorage),
  partialize: (state) => ({
    items: state.items,
    activeItemId: state.activeItemId,
    hasImportedData: state.hasImportedData,
    importedLayerName: state.importedLayerName,
    layerStyles: state.layerStyles,
    fabPosition: state.fabPosition,
  }),
  onRehydrateStorage: () => (state) => {
    if (!state) return
    const clusteringEnabled = useClusteringStore.getState().isEnabled
    if (state.layerStyles.clusterEnabled !== clusteringEnabled) {
      useClusteringStore.getState().toggle()
    }
  },
}))
