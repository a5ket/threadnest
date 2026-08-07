import { createMutationHook } from '@/common/api-mutation'
import { meAuthChangeEmail, meAuthChangePassword, meNestLeave, meProfileUpdate } from '@/generated/api/me/me'
import { useMeStore } from './components/me-store-provider'

export const useLeaveNest = createMutationHook(
  (nestSlug: string) => meNestLeave(nestSlug),
  204
)

export const useUpdateProfile = createMutationHook(meProfileUpdate, 200)

export const useChangePassword = createMutationHook(
  (dto: { currentPassword: string, newPassword: string }) => meAuthChangePassword(dto),
  204
)

export const useChangeEmail = createMutationHook(meAuthChangeEmail, 204)

export function useUser() {
  return useMeStore((s) => s.user)
}

export function useIsSignedIn() {
  return useMeStore((s) => s.user !== null)
}

export function useMeNests() {
  return useMeStore((s) => s.nests)
}

export function useAddNest() {
  return useMeStore((s) => s.addNest)
}

export function useRemoveNest() {
  return useMeStore((s) => s.removeNest)
}
