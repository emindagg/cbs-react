import { create } from 'zustand'

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
    speed: number
    timeMode: 'local' | 'utc'
    isPlaying: boolean
    features: AstroFeatures

    // Actions
    setIsEnabled: (enabled: boolean) => void
    setCurrentDate: (date: Date) => void
    setSpeed: (speed: number) => void
    setTimeMode: (mode: 'local' | 'utc') => void
    setIsPlaying: (playing: boolean) => void
    toggleFeature: (feature: keyof AstroFeatures) => void
}

export const useAstroStore = create<AstroState>((set) => ({
    isEnabled: false,
    currentDate: new Date(),
    speed: 1,
    timeMode: 'local',
    isPlaying: false,
    features: {
        sunPosition: true,
        terminator: true,
        moonPhase: true,
        axialTilt: false,
        eclipses: false
    },

    setIsEnabled: (enabled) => set({ isEnabled: enabled }),
    setCurrentDate: (date) => set({ currentDate: date }),
    setSpeed: (speed) => set({ speed }),
    setTimeMode: (mode) => set({ timeMode: mode }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    toggleFeature: (feature) => set((state) => ({
        features: {
            ...state.features,
            [feature]: !state.features[feature]
        }
    }))
}))
