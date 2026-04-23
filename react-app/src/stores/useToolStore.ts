import { create } from 'zustand'

export type ToolType = 'none' | 'measure-distance' | 'measure-area' | 'analysis' | 'timeline' | 'elevation-profile'
export type ToolsMenuMode = 'closed' | 'full' | 'icons-only'

interface ToolState {
  activeTool: ToolType
  showMeasurementTools: boolean
  showAdvancedAnalysis: boolean

  // Distance Measurement State
  distancePoints: [number, number][]
  isDrawingDistance: boolean

  toolsMenuMode: ToolsMenuMode

  // Actions
  setActiveTool: (tool: ToolType) => void
  toggleMeasurementTools: () => void
  toggleAdvancedAnalysis: () => void
  toggleToolsMenu: () => void
  cycleToolsMenu: () => void
  toggleMenuCompact: () => void
  closeToolsMenu: () => void
  setDistancePoints: (points: [number, number][]) => void
  setIsDrawingDistance: (isDrawing: boolean) => void
  resetDistance: () => void
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'none',

  showMeasurementTools: true,
  showAdvancedAnalysis: true,
  distancePoints: [],
  isDrawingDistance: false,
  toolsMenuMode: 'closed',

  setActiveTool: (tool) => set((state) => {
    // Reset other tools when switching
    if (tool !== 'measure-distance' && state.activeTool === 'measure-distance') {
      return { activeTool: tool, distancePoints: [], isDrawingDistance: false }
    }
    return { activeTool: tool }
  }),

  toggleMeasurementTools: () => set((state) => {
    if (!state.showMeasurementTools) {
      return { showMeasurementTools: true }
    }

    if (state.activeTool === 'measure-distance') {
      return {
        showMeasurementTools: false,
        activeTool: 'none',
        distancePoints: [],
        isDrawingDistance: false,
      }
    }

    return { showMeasurementTools: false }
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
  setIsDrawingDistance: (isDrawing) => set({ isDrawingDistance: isDrawing }),

  resetDistance: () => set({
    distancePoints: [],
    isDrawingDistance: false,
  }),
}))
