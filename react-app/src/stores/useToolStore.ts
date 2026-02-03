import { create } from 'zustand'

export type ToolType = 'none' | 'measure-distance' | 'measure-area' | 'analysis' | 'timeline'
export type DrawMode = 'none' | 'point' | 'polygon' | 'line' | 'circle'

interface ToolState {
    activeTool: ToolType

    // Distance Measurement State
    distancePoints: [number, number][]
    distanceGhostPoint: [number, number] | null
    isDrawingDistance: boolean

    // General Drawing State (for Data Creation)
    drawMode: DrawMode
    drawPoints: [number, number][] // For Point, Line, Polygon
    drawGhostPoint: [number, number] | null
    drawCenter: [number, number] | null // For Circle
    drawRadius: number | null // For Circle
    isDrawing: boolean
    isToolsMenuOpen: boolean

    // Actions
    setActiveTool: (tool: ToolType) => void
    setIsToolsMenuOpen: (isOpen: boolean) => void
    setDistancePoints: (points: [number, number][]) => void
    setDistanceGhostPoint: (point: [number, number] | null) => void
    setIsDrawingDistance: (isDrawing: boolean) => void
    resetDistance: () => void

    // Draw Actions
    setDrawMode: (mode: DrawMode) => void
    setDrawPoints: (points: [number, number][]) => void
    setDrawGhostPoint: (point: [number, number] | null) => void
    setDrawCenter: (center: [number, number] | null) => void
    setDrawRadius: (radius: number | null) => void
    setIsDrawing: (isDrawing: boolean) => void
    resetDraw: () => void
}

export const useToolStore = create<ToolState>((set) => ({
    activeTool: 'none',

    distancePoints: [],
    distanceGhostPoint: null,
    isDrawingDistance: false,

    drawMode: 'none',
    drawPoints: [],
    drawGhostPoint: null,
    drawCenter: null,
    drawRadius: null,
    isDrawing: false,
    isToolsMenuOpen: false,

    setActiveTool: (tool) => set((state) => {
        // Reset other tools when switching
        if (tool !== 'measure-distance' && state.activeTool === 'measure-distance') {
            return { activeTool: tool, distancePoints: [], distanceGhostPoint: null, isDrawingDistance: false }
        }
        return { activeTool: tool }
    }),

    setIsToolsMenuOpen: (isOpen) => set({ isToolsMenuOpen: isOpen }),

    setDistancePoints: (points) => set({ distancePoints: points }),
    setDistanceGhostPoint: (point) => set({ distanceGhostPoint: point }),
    setIsDrawingDistance: (isDrawing) => set({ isDrawingDistance: isDrawing }),

    resetDistance: () => set({
        distancePoints: [],
        distanceGhostPoint: null,
        isDrawingDistance: false
    }),

    setDrawMode: (mode) => set((state) => {
        // Reset drawing state when mode changes
        if (mode !== state.drawMode) {
            return {
                drawMode: mode,
                drawPoints: [],
                drawGhostPoint: null,
                drawCenter: null,
                drawRadius: null,
                isDrawing: mode !== 'none' // Auto start drawing if mode is not none
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
        drawMode: 'none'
    })
}))
