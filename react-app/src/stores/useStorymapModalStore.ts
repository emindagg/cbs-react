import { create } from 'zustand'

interface StorymapModalState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useStorymapModalStore = create<StorymapModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))

/** İmperatif API: modal dışından StorymapModal.open() ile açmak için */
export const StorymapModal = {
  open: () => useStorymapModalStore.getState().open(),
  close: () => useStorymapModalStore.getState().close(),
}
