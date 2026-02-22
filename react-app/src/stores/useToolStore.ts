import { create } from 'zustand'

export type ToolType = 'none' | 'measure-distance' | 'measure-area' | 'analysis' | 'timeline'
export type ToolsMenuMode = 'closed' | 'full' | 'icons-only'

interface ToolState {
  activeTool: ToolType
  showAdvancedAnalysis: boolean

  // Distance Measurement State
  distancePoints: [number, number][]
  distanceGhostPoint: [number, number] | null
  isDrawingDistance: boolean

  toolsMenuMode: ToolsMenuMode

  // Actions
  setActiveTool: (tool: ToolType) => void
  toggleAdvancedAnalysis: () => void
  toggleToolsMenu: () => void
  cycleToolsMenu: () => void
  toggleMenuCompact: () => void
  closeToolsMenu: () => void
  setDistancePoints: (points: [number, number][]) => void
  setDistanceGhostPoint: (point: [number, number] | null) => void
  setIsDrawingDistance: (isDrawing: boolean) => void
  resetDistance: () => void
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'none',

  showAdvancedAnalysis: true,
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

  toggleAdvancedAnalysis: () => set((state) => ({ showAdvancedAnalysis: !state.showAdvancedAnalysis })),

  toggleToolsMenu: () => set((state) => ({
    toolsMenuMode: state.toolsMenuMode === 'closed' ? 'full' : 'closed',
  })),

  cycleToolsMenu: () => set((state) => {
    const next: Record<ToolsMenuMode, ToolsMenuMode> = {
      closed: 'full',
      full: 'icons-only',
      'icons-only': 'closed',
    }
    return { toolsMenuMode: next[state.toolsMenuMode] }
  }),

  toggleMenuCompact: () => set((state) => ({
    toolsMenuMode: state.toolsMenuMode === 'full' ? 'icons-only' : 'full',
  })),

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
