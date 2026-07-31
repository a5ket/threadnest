import type { BootstrapData } from '@/features/me/me.types'
import { createStore } from 'zustand'

export interface MeState {
  user: BootstrapData['user'] | null
  nests: BootstrapData['nests']
  setMe: (data: BootstrapData | null) => void
  clear: () => void
}

export function createMeStore(initialData: BootstrapData | null) {
  return createStore<MeState>((set) => ({
    user: initialData?.user ?? null,
    nests: initialData?.nests ?? [],
    setMe: (data) =>
      set({
        user: data?.user ?? null,
        nests: data?.nests ?? []
      }),
    clear: () => set({ user: null, nests: [] })
  }))
}

export type MeStoreApi = ReturnType<typeof createMeStore>
