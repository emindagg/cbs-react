import { create } from 'zustand'

interface VideoModalState {
  isOpen: boolean
  /** İframe yüklendiğinde otomatik oynatılacak hedef video — örn. "cbs-7" */
  targetVideoId: string | null
  open: (targetVideoId?: string) => void
  close: () => void
  clearTarget: () => void
}

export const useVideoModalStore = create<VideoModalState>((set) => ({
  isOpen: false,
  targetVideoId: null,
  open: (targetVideoId) => set({ isOpen: true, targetVideoId: targetVideoId ?? null }),
  close: () => set({ isOpen: false, targetVideoId: null }),
  clearTarget: () => set({ targetVideoId: null }),
}))

/** İmperatif API: modal dışından VideoModal.open() ile açmak için */
export const VideoModal = {
  open: (targetVideoId?: string) => useVideoModalStore.getState().open(targetVideoId),
  close: () => useVideoModalStore.getState().close(),
}
