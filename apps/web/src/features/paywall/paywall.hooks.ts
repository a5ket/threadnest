'use client'

import { ApiError, type ApiErrorResponse } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { useQuery } from '@tanstack/react-query'
import { nestPayoutGet, nestPayoutStartOnboarding, nestPayoutWithdraw, nestPaywallDisable, nestPaywallGet, nestPaywallSetPrice, nestSubscriptionCancel, nestSubscriptionCheckout, nestSubscriptionGet } from './paywall.api'

export const nestPaywallQueryKey = (nestSlug: string) => ['nests', nestSlug, 'paywall']
export const nestSubscriptionQueryKey = (nestSlug: string) => ['nests', nestSlug, 'subscription']
export const nestPayoutQueryKey = (nestSlug: string) => ['nests', nestSlug, 'payout']

export function useNestPaywall(nestSlug: string, enabled = true) {
  return useQuery({
    queryKey: nestPaywallQueryKey(nestSlug),
    queryFn: async () => {
      const result = await nestPaywallGet(nestSlug)
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data
    },
    enabled
  })
}

export const useSetNestPaywallPrice = createMutationHook(
  ({ nestSlug, amountCents }: { nestSlug: string, amountCents: number }) => nestPaywallSetPrice(nestSlug, { amountCents }),
  200
)

export const useDisableNestPaywall = createMutationHook(
  (nestSlug: string) => nestPaywallDisable(nestSlug),
  200
)

export const useNestSubscriptionCheckout = createMutationHook(
  (nestSlug: string) => nestSubscriptionCheckout(nestSlug),
  201
)

export function useNestSubscription(nestSlug: string) {
  return useQuery({
    queryKey: nestSubscriptionQueryKey(nestSlug),
    queryFn: async () => {
      const result = await nestSubscriptionGet(nestSlug)
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data
    }
  })
}

export const useCancelNestSubscription = createMutationHook(
  (nestSlug: string) => nestSubscriptionCancel(nestSlug),
  200
)

export function useNestPayoutAccount(nestSlug: string) {
  return useQuery({
    queryKey: nestPayoutQueryKey(nestSlug),
    queryFn: async () => {
      const result = await nestPayoutGet(nestSlug)
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data
    }
  })
}

export const useStartNestPayoutOnboarding = createMutationHook(
  (nestSlug: string) => nestPayoutStartOnboarding(nestSlug),
  201
)

export const useWithdrawNestBalance = createMutationHook(
  (nestSlug: string) => nestPayoutWithdraw(nestSlug),
  201
)
