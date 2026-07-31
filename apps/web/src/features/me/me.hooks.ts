import { useMeStore } from './components/me-store-provider'

export function useUser() {
  return useMeStore((s) => s.user)
}

export function useIsSignedIn() {
  return useMeStore((s) => s.user !== null)
}

export function useMeNests() {
  return useMeStore((s) => s.nests)
}
