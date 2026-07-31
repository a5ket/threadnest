'use client'

import { BootstrapData } from '@/features/me/me.types'
import { createContext, PropsWithChildren, useContext, useState } from 'react'
import { useStore } from 'zustand'
import { createMeStore, MeState, MeStoreApi } from '../me.store'

const MeStoreContext = createContext<MeStoreApi | null>(null)

export type MeStoreProviderProps = PropsWithChildren & {
  initialData: BootstrapData | null
}

export function MeStoreProvider({ initialData, children }: MeStoreProviderProps) {
  const [store] = useState(() => createMeStore(initialData))

  return <MeStoreContext.Provider value={store}>{children}</MeStoreContext.Provider>
}

export function useMeStoreApi(): MeStoreApi {
  const store = useContext(MeStoreContext)

  if (!store) {
    throw new Error('useMeStoreApi must be used within MeStoreProvider')
  }

  return store
}

export function useMeStore<T>(selector: (state: MeState) => T): T {
  return useStore(useMeStoreApi(), selector)
}
