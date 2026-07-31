import { create } from 'zustand'

export type AuthOverlayView = 'login' | 'register' | 'reset-password'

interface AuthOverlayState {
  view: AuthOverlayView | null
  open: (view: AuthOverlayView) => void
  close: () => void
}

export const useAuthOverlayStore = create<AuthOverlayState>((set) => ({
  view: null,
  open: (view) => set({ view }),
  close: () => set({ view: null })
}))
