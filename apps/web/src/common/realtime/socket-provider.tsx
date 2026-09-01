'use client'

import { env } from '@/config/env'
import { useIsSignedIn } from '@/features/me/me.hooks'
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { io, type Socket } from 'socket.io-client'

// A tiny external store rather than useState — the socket connection is an external resource,
// and syncing it into React via useSyncExternalStore avoids the set-state-in-effect anti-pattern
// (calling a state setter directly in an effect body triggers a lint error in this project).
function createSocketStore() {
  let current: Socket | null = null
  const listeners = new Set<() => void>()

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => current,
    set(value: Socket | null) {
      current = value
      listeners.forEach((listener) => listener())
    }
  }
}

const SocketContext = createContext<ReturnType<typeof createSocketStore> | null>(null)

// The access token is an httpOnly cookie, so it's never read here — withCredentials lets the
// browser attach it to the handshake itself, same as any other same-site request to the API.
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const isSignedIn = useIsSignedIn()
  const [store] = useState(createSocketStore)

  useEffect(() => {
    if (!isSignedIn) return

    const instance = io(env.apiUrl, { withCredentials: true })
    store.set(instance)

    return () => {
      instance.disconnect()
      store.set(null)
    }
  }, [isSignedIn, store])

  return (
    <SocketContext.Provider value={store}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const store = useContext(SocketContext)

  return useSyncExternalStore(
    store?.subscribe ?? (() => () => { }),
    () => store?.getSnapshot() ?? null,
    () => null
  )
}
