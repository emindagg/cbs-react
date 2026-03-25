import { create } from 'zustand'

export type ClusterMode = 'normal' | 'clustered' | 'hidden'

interface ClusteringState {
  isEnabled: boolean
  mode: ClusterMode
  toggle: () => void
  cycle: () => void
  setMode: (mode: ClusterMode) => void
}

const MODE_CYCLE: Record<ClusterMode, ClusterMode> = {
  normal: 'clustered',
  clustered: 'hidden',
  hidden: 'normal',
}

export const useClusteringStore = create<ClusteringState>((set) => ({
  isEnabled: false,
  mode: 'normal',

  toggle: () => set((state) => {
    const nextEnabled = !state.isEnabled
    return {
      isEnabled: nextEnabled,
      mode: nextEnabled ? 'clustered' : 'normal',
    }
  }),

  cycle: () => set((state) => {
    const next = MODE_CYCLE[state.mode]
    return {
      mode: next,
      isEnabled: next === 'clustered',
    }
  }),

  setMode: (mode) => set({
    mode,
    isEnabled: mode === 'clustered',
  }),
}))
