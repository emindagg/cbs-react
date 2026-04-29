import { create } from 'zustand'

interface VideoModalState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useVideoModalStore = create<VideoModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))

/** İmperatif API: modal dışından VideoModal.open() ile açmak için */
export const VideoModal = {
  open: () => useVideoModalStore.getState().open(),
  close: () => useVideoModalStore.getState().close(),
}
