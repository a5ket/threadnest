import type { ThreadDetail } from '@/features/thread/thread.types'
import { createStore } from 'zustand'

export interface ThreadState {
  thread: ThreadDetail
  setThread: (thread: ThreadDetail) => void
}

export function createThreadStore(initialThread: ThreadDetail) {
  return createStore<ThreadState>((set) => ({
    thread: initialThread,
    setThread: (thread) => set({ thread })
  }))
}

export type ThreadStoreApi = ReturnType<typeof createThreadStore>
