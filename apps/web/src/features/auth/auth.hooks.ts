'use client'

import { createMutationHook, createVoidMutationHook } from '@/common/api-mutation'
import { useMeStore } from '@/features/me/components/me-store-provider'
import { getMeClient } from '@/features/me/me.client'
import { useCallback } from 'react'
import {
  authConfirmEmailChange,
  authConfirmEmailVerification,
  authConfirmPasswordReset,
  authLogin,
  authLogout,
  authLogoutAll,
  authRefresh,
  authRegister,
  authRequestEmailVerification,
  authRequestPasswordReset
} from './auth.api'

export const useRegister = createMutationHook(authRegister, 201)
export const useLogin = createMutationHook(authLogin, 201)
export const useRefresh = createMutationHook(authRefresh, 201)
export const useLogout = createVoidMutationHook(authLogout, 204)
export const useLogoutAll = createVoidMutationHook(authLogoutAll, 204)
export const useRequestEmailVerification = createVoidMutationHook(authRequestEmailVerification, 204)
export const useConfirmEmailVerification = createMutationHook(authConfirmEmailVerification, 204)
export const useRequestPasswordReset = createMutationHook(authRequestPasswordReset, 204)
export const useConfirmPasswordReset = createMutationHook(authConfirmPasswordReset, 204)
export const useConfirmEmailChange = createMutationHook(authConfirmEmailChange, 204)

/**
 * After a successful login/register, tokens are set as cookies but the client-side
 * `me` store is still unhydrated (it's only ever seeded by the server layout on a
 * full page load). Fetches bootstrap data and hydrates the store, then runs
 * `onAuthenticated`. Runs it even if the bootstrap fetch fails — auth already
 * succeeded, and the store will resync on the next server-rendered navigation.
 */
export function useAuthSuccessHandler(onAuthenticated: () => void) {
  const setMe = useMeStore((state) => state.setMe)

  return useCallback(async () => {
    try {
      const me = await getMeClient()
      setMe(me)
    }
    catch {
      // Cookies are already set; the store will resync via getMeServer() on next navigation.
    }

    onAuthenticated()
  }, [setMe, onAuthenticated])
}

/**
 * After a successful logout/logout-all, clears the client-side `me` store so the UI
 * reflects the signed-out state immediately, then runs `onSignedOut`. Shared between
 * `useLogout` and `useLogoutAll` since both need the same client-side cleanup.
 */
export function useAuthSignOutHandler(onSignedOut: () => void) {
  const clearMe = useMeStore((state) => state.clear)

  return useCallback(() => {
    clearMe()
    onSignedOut()
  }, [clearMe, onSignedOut])
}
