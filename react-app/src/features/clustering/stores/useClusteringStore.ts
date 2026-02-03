import { create } from 'zustand';

interface ClusteringState {
    isEnabled: boolean;
    toggle: () => void;
}

export const useClusteringStore = create<ClusteringState>((set) => ({
    isEnabled: false,
    toggle: () => set((state) => ({ isEnabled: !state.isEnabled })),
}));
