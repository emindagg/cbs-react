import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Geometry } from 'geojson'

export interface DataItem {
    id: string
    name: string
    type: 'point' | 'polygon' | 'line' | 'circle'
    date?: string
    geometry: Geometry
    properties: Record<string, any>
    visible: boolean
}

interface DataState {
    items: DataItem[]
    activeItemId: string | null

    addItem: (item: Omit<DataItem, 'id' | 'visible'>) => void
    removeItem: (id: string) => void
    toggleVisibility: (id: string) => void
    setActiveItem: (id: string | null) => void
    clearAll: () => void
}

export const useDataStore = create<DataState>((set) => ({
    items: [],
    activeItemId: null,

    addItem: (item) => set((state) => ({
        items: [...state.items, { ...item, id: uuidv4(), visible: true }]
    })),

    removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
    })),

    toggleVisibility: (id) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, visible: !i.visible } : i)
    })),

    setActiveItem: (id) => set({ activeItemId: id }),

    clearAll: () => set({ items: [] })
}))
