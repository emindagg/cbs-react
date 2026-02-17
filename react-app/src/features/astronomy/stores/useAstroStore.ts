import { create } from 'zustand'

import { getMoonPhaseAngle } from '../utils/astroUtils'

const MIN_ASTRO_SPEED = 0.1
const MAX_ASTRO_SPEED = 100

export interface AstroFeatures {
  sunPosition: boolean
  terminator: boolean
  moonPhase: boolean
  axialTilt: boolean
  eclipses: boolean
}

interface AstroState {
  isEnabled: boolean
  currentDate: Date
  moonPhaseAngle: number
  speed: number
  timeMode: 'local' | 'utc'
  isPlaying: boolean
  features: AstroFeatures

  // Actions
  setIsEnabled: (enabled: boolean) => void
  setCurrentDate: (date: Date) => void
  setMoonPhaseAngle: (angle: number) => void
  setSpeed: (speed: number) => void
  setTimeMode: (mode: 'local' | 'utc') => void
  setIsPlaying: (playing: boolean) => void
  toggleFeature: (feature: keyof AstroFeatures) => void
}

export const useAstroStore = create<AstroState>((set) => ({
  isEnabled: false,
  currentDate: new Date(),
  moonPhaseAngle: getMoonPhaseAngle(new Date()),
  speed: 1,
  timeMode: 'local',
  isPlaying: false,
  features: {
    sunPosition: false,
    terminator: false,
    moonPhase: false,
    axialTilt: false,
    eclipses: false,
  },

  setIsEnabled: (enabled) => set({ isEnabled: enabled }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setMoonPhaseAngle: (angle) => set({ moonPhaseAngle: ((angle % 360) + 360) % 360 }),
  setSpeed: (speed) => set({
    speed: Math.max(MIN_ASTRO_SPEED, Math.min(MAX_ASTRO_SPEED, speed)),
  }),
  setTimeMode: (mode) => set({ timeMode: mode }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  toggleFeature: (feature) => set((state) => ({
    features: {
      ...state.features,
      [feature]: !state.features[feature],
    },
  })),
}))
