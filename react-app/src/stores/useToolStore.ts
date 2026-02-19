import { create } from 'zustand'

export type ToolType = 'none' | 'measure-distance' | 'measure-area' | 'analysis' | 'timeline'
export type ToolsMenuMode = 'closed' | 'full' | 'icons-only'

interface ToolState {
  activeTool: ToolType

  // Distance Measurement State
  distancePoints: [number, number][]
  distanceGhostPoint: [number, number] | null
  isDrawingDistance: boolean

  toolsMenuMode: ToolsMenuMode

  // Actions
  setActiveTool: (tool: ToolType) => void
  cycleToolsMenu: () => void
  closeToolsMenu: () => void
  setDistancePoints: (points: [number, number][]) => void
  setDistanceGhostPoint: (point: [number, number] | null) => void
  setIsDrawingDistance: (isDrawing: boolean) => void
  resetDistance: () => void
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'none',

  distancePoints: [],
  distanceGhostPoint: null,
  isDrawingDistance: false,
  toolsMenuMode: 'closed',

  setActiveTool: (tool) => set((state) => {
    // Reset other tools when switching
    if (tool !== 'measure-distance' && state.activeTool === 'measure-distance') {
      return { activeTool: tool, distancePoints: [], distanceGhostPoint: null, isDrawingDistance: false }
    }
    return { activeTool: tool }
  }),

  cycleToolsMenu: () => set((state) => {
    const next: Record<ToolsMenuMode, ToolsMenuMode> = {
      closed: 'full',
      full: 'icons-only',
      'icons-only': 'closed',
    }
    return { toolsMenuMode: next[state.toolsMenuMode] }
  }),
  closeToolsMenu: () => set({ toolsMenuMode: 'closed' }),

  setDistancePoints: (points) => set({ distancePoints: points }),
  setDistanceGhostPoint: (point) => set({ distanceGhostPoint: point }),
  setIsDrawingDistance: (isDrawing) => set({ isDrawingDistance: isDrawing }),

  resetDistance: () => set({
    distancePoints: [],
    distanceGhostPoint: null,
    isDrawingDistance: false,
  }),
}))
