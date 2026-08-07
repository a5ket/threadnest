import { createMutationHook } from '@/common/api-mutation'
import { meNestLeave } from '@/generated/api/me/me'
import { useMeStore } from './components/me-store-provider'

export const useLeaveNest = createMutationHook(
  (nestSlug: string) => meNestLeave(nestSlug),
  204
)

export function useUser() {
  return useMeStore((s) => s.user)
}

export function useIsSignedIn() {
  return useMeStore((s) => s.user !== null)
}

export function useMeNests() {
  return useMeStore((s) => s.nests)
}
