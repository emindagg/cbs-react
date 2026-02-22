import { create } from 'zustand'

export type FilterMode = 'cumulative' | 'range'
export type TimeStep = 'hour' | 'day' | 'week' | 'month' | 'year'

export interface NumericFilter {
  field: string
  min: number
  max: number
  currentMin: number
  currentMax: number
  unit: string
}

export interface TimelineState {
  isActive: boolean
  isCollapsed: boolean
  filterMode: FilterMode
  timeStep: TimeStep

  rangeMin: number
  rangeMax: number
  currentEnd: number

  isPlaying: boolean
  playSpeed: number

  numericFilter: NumericFilter | null
  availableNumericFields: string[]

  activate: (min: number, max: number) => void
  deactivate: () => void
  setCurrentEnd: (end: number) => void
  setCurrentRange: (start: number, end: number) => void
  setPlaying: (playing: boolean) => void
  setPlaySpeed: (speed: number) => void
  setFilterMode: (mode: FilterMode) => void
  setTimeStep: (step: TimeStep) => void
  setCollapsed: (collapsed: boolean) => void
  setNumericFilter: (filter: NumericFilter | null) => void
  setAvailableNumericFields: (fields: string[]) => void
  updateNumericRange: (min: number, max: number) => void
  stepForward: () => void
  stepBackward: () => void
  jumpToStart: () => void
  jumpToEnd: () => void
  tick: () => boolean
  getEffectiveStart: () => number
}

export const STEP_MS: Record<TimeStep, number> = {
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
  year: 31_536_000_000,
}

function detectStep(span: number): TimeStep {
  if (span <= STEP_MS.day * 3) return 'hour'
  if (span <= STEP_MS.month * 3) return 'day'
  if (span <= STEP_MS.year) return 'week'
  if (span <= STEP_MS.year * 5) return 'month'
  return 'year'
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  isActive: false,
  isCollapsed: false,
  filterMode: 'cumulative',
  timeStep: 'day',

  rangeMin: 0,
  rangeMax: 0,
  currentEnd: 0,
  isPlaying: false,
  playSpeed: 500,

  numericFilter: null,
  availableNumericFields: [],

  activate: (min, max) => {
    const step = detectStep(max - min)
    set({
      isActive: true,
      rangeMin: min,
      rangeMax: max,
      currentEnd: max,
      isPlaying: false,
      timeStep: step,
      isCollapsed: false,
    })
  },

  deactivate: () => set({
    isActive: false,
    isPlaying: false,
    isCollapsed: false,
    currentEnd: 0,
    rangeMin: 0,
    rangeMax: 0,
    numericFilter: null,
    availableNumericFields: [],
  }),

  setCurrentEnd: (end) => set({ currentEnd: end }),
  setCurrentRange: (_start, end) => set({ currentEnd: end }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPlaySpeed: (speed) => set({ playSpeed: Math.max(100, Math.min(2000, speed)) }),
  setFilterMode: (mode) => set({ filterMode: mode }),
  setTimeStep: (step) => set({ timeStep: step }),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),

  setNumericFilter: (filter) => set({ numericFilter: filter }),
  setAvailableNumericFields: (fields) => set({ availableNumericFields: fields }),
  updateNumericRange: (min, max) => set((state) => {
    if (!state.numericFilter) return {}
    return { numericFilter: { ...state.numericFilter, currentMin: min, currentMax: max } }
  }),

  getEffectiveStart: () => {
    const { filterMode, currentEnd, timeStep, rangeMin } = get()
    if (filterMode === 'cumulative') return rangeMin
    return Math.max(rangeMin, currentEnd - STEP_MS[timeStep])
  },

  stepForward: () => {
    const { currentEnd, rangeMax, timeStep } = get()
    const next = Math.min(currentEnd + STEP_MS[timeStep], rangeMax)
    set({ currentEnd: next })
  },

  stepBackward: () => {
    const { currentEnd, rangeMin, timeStep } = get()
    const next = Math.max(currentEnd - STEP_MS[timeStep], rangeMin)
    set({ currentEnd: next })
  },

  jumpToStart: () => {
    const { rangeMin, timeStep } = get()
    set({ currentEnd: rangeMin + STEP_MS[timeStep] })
  },

  jumpToEnd: () => {
    const { rangeMax } = get()
    set({ currentEnd: rangeMax })
  },

  tick: () => {
    const { currentEnd, rangeMax, timeStep } = get()
    if (currentEnd >= rangeMax) {
      set({ isPlaying: false })
      return false
    }
    set({ currentEnd: Math.min(currentEnd + STEP_MS[timeStep], rangeMax) })
    return true
  },
}))
