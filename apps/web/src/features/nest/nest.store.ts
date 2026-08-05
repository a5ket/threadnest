import type { NestDetail } from '@/features/nest/nest.types'
import { createStore } from 'zustand'

export interface NestState {
  nest: NestDetail
  setNest: (nest: NestDetail) => void
}

export function createNestStore(initialNest: NestDetail) {
  return createStore<NestState>((set) => ({
    nest: initialNest,
    setNest: (nest) => set({ nest })
  }))
}

export type NestStoreApi = ReturnType<typeof createNestStore>
