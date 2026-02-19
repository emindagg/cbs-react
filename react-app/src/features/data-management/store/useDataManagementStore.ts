import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

import type { DataManagementStore, NewDataItem } from '../types'

const createPersistedItem = (item: NewDataItem) => ({
  ...item,
  id: uuidv4(),
  visible: true,
})

export const useDataManagementStore = create<DataManagementStore>((set) => ({
  items: [],
  activeItemId: null,

  drawMode: 'none',
  drawPoints: [],
  drawGhostPoint: null,
  drawCenter: null,
  drawRadius: null,
  isDrawing: false,

  addItem: (item) => set((state) => ({
    items: [...state.items, createPersistedItem(item)],
  })),

  addItems: (items) => set((state) => ({
    items: [...state.items, ...items.map(createPersistedItem)],
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id),
  })),

  toggleVisibility: (id) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, visible: !i.visible } : i),
  })),

  setActiveItem: (id) => set({ activeItemId: id }),

  clearAll: () => set({
    items: [],
    activeItemId: null,
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
}))
