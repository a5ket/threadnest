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

// Soft navigation won't re-run the server layout's fetch, so hydrate the store by hand.
export function useAuthSuccessHandler(onAuthenticated: () => void) {
  const setMe = useMeStore((state) => state.setMe)

  return useCallback(async () => {
    try {
      const me = await getMeClient()
      setMe(me)
    }
    catch {
      // Auth already succeeded; store resyncs on the next server-rendered nav.
    }

    onAuthenticated()
  }, [setMe, onAuthenticated])
}

// Shared by useLogout/useLogoutAll — same client-side cleanup either way.
export function useAuthSignOutHandler(onSignedOut: () => void) {
  const clearMe = useMeStore((state) => state.clear)

  return useCallback(() => {
    clearMe()
    onSignedOut()
  }, [clearMe, onSignedOut])
}
