'use client'

import { ThreadDetail } from '@/features/thread/thread.types'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { createThreadStore, ThreadState, ThreadStoreApi } from '../thread.store'

const ThreadStoreContext = createContext<ThreadStoreApi | null>(null)

export type ThreadStoreProviderProps = PropsWithChildren & {
  initialThread: ThreadDetail
}

export function ThreadStoreProvider({ initialThread, children }: ThreadStoreProviderProps) {
  const [store] = useState(() => createThreadStore(initialThread))

  // initialThread is a fresh object on every server render (e.g. router.refresh()
  // after posting a comment) — the store must be kept in sync with it explicitly,
  // since the lazy useState initializer above only runs once.
  useEffect(() => {
    store.getState().setThread(initialThread)
  }, [store, initialThread])

  return <ThreadStoreContext.Provider value={store}>{children}</ThreadStoreContext.Provider>
}

export function useThreadStoreApi(): ThreadStoreApi {
  const store = useContext(ThreadStoreContext)

  if (!store) {
    throw new Error('useThreadStoreApi must be used within ThreadStoreProvider')
  }

  return store
}

export function useThreadStore<T>(selector: (state: ThreadState) => T): T {
  return useStore(useThreadStoreApi(), selector)
}
