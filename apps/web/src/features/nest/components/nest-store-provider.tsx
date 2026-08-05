'use client'

import { NestDetail } from '@/features/nest/nest.types'
import { createContext, PropsWithChildren, useContext, useState } from 'react'
import { useStore } from 'zustand'
import { createNestStore, NestState, NestStoreApi } from '../nest.store'

const NestStoreContext = createContext<NestStoreApi | null>(null)

export type NestStoreProviderProps = PropsWithChildren & {
  initialNest: NestDetail
}

export function NestStoreProvider({ initialNest, children }: NestStoreProviderProps) {
  const [store] = useState(() => createNestStore(initialNest))

  return <NestStoreContext.Provider value={store}>{children}</NestStoreContext.Provider>
}

export function useNestStoreApi(): NestStoreApi {
  const store = useContext(NestStoreContext)

  if (!store) {
    throw new Error('useNestStoreApi must be used within NestStoreProvider')
  }

  return store
}

export function useNestStore<T>(selector: (state: NestState) => T): T {
  return useStore(useNestStoreApi(), selector)
}
