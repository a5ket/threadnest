import type { BootstrapData, MeBootstrapError, MeBootstrapResult } from '@/features/me/me.types'
import { createStore } from 'zustand'

type NestReference = BootstrapData['nests'][number]

export interface MeState {
  user: BootstrapData['user'] | null
  nests: BootstrapData['nests']
  error: MeBootstrapError | null
  setMe: (data: BootstrapData | null) => void
  addNest: (nest: NestReference) => void
  removeNest: (slug: string) => void
  clear: () => void
}

export function createMeStore(initial: MeBootstrapResult) {
  return createStore<MeState>((set) => ({
    user: initial.status === 'signed-in' ? initial.data.user : null,
    nests: initial.status === 'signed-in' ? initial.data.nests : [],
    error: initial.status === 'error' ? initial.error : null,
    setMe: (data) =>
      set({
        user: data?.user ?? null,
        nests: data?.nests ?? [],
        error: null
      }),
    addNest: (nest) =>
      set((state) => ({
        nests: state.nests.some((n) => n.slug === nest.slug) ? state.nests : [...state.nests, nest]
      })),
    removeNest: (slug) =>
      set((state) => ({
        nests: state.nests.filter((n) => n.slug !== slug)
      })),
    clear: () => set({ user: null, nests: [], error: null })
  }))
}

export type MeStoreApi = ReturnType<typeof createMeStore>
