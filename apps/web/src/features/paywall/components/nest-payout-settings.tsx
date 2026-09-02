'use client'

import { Badge } from '@/common/components/badge'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { nestPayoutQueryKey, useNestPayoutAccount, useStartNestPayoutOnboarding, useWithdrawNestBalance } from '../paywall.hooks'

interface NestPayoutSettingsProps {
  nestSlug: string
}

export function NestPayoutSettings({ nestSlug }: NestPayoutSettingsProps) {
  const { data: account, isLoading } = useNestPayoutAccount(nestSlug)
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: nestPayoutQueryKey(nestSlug) })

  const onboarding = useStartNestPayoutOnboarding({
    onSuccess: (data) => { window.location.href = data.url }
  })

  const withdraw = useWithdrawNestBalance({ onSuccess: invalidate })

  useEffect(() => {
    if (!searchParams.has('payout')) return

    invalidate()
    router.replace(`/n/${nestSlug}/settings`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  if (isLoading || !account) return null

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-border bg-card p-4'>
      <div>
        <h2 className='text-sm font-semibold'>Payouts</h2>
        <p className='text-xs text-muted-foreground'>Connect a Stripe account to withdraw this nest&apos;s subscription earnings.</p>
      </div>

      <div className='flex items-center justify-between rounded-md bg-background p-3 text-sm'>
        <span>
          Balance: $
          {(account.balanceCents / 100).toFixed(2)}
        </span>

        {account.isConnected && (
          <Badge variant={account.payoutsEnabled ? 'success' : 'warning'}>
            {account.payoutsEnabled ? 'Payouts enabled' : 'Setup incomplete'}
          </Badge>
        )}
      </div>

      {!account.isConnected && (
        <button
          type='button'
          disabled={onboarding.isPending}
          onClick={() => onboarding.mutate(nestSlug)}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {onboarding.isPending ? 'Connecting...' : 'Connect payout account'}
        </button>
      )}

      {account.isConnected && !account.payoutsEnabled && (
        <button
          type='button'
          disabled={onboarding.isPending}
          onClick={() => onboarding.mutate(nestSlug)}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {onboarding.isPending ? 'Connecting...' : 'Finish onboarding'}
        </button>
      )}

      {account.isConnected && account.payoutsEnabled && (
        <button
          type='button'
          disabled={withdraw.isPending || account.balanceCents === 0}
          onClick={() => withdraw.mutate(nestSlug)}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {withdraw.isPending ? 'Withdrawing...' : 'Withdraw balance'}
        </button>
      )}

      {onboarding.isError && <p className='text-sm text-destructive'>Couldn&apos;t start onboarding. Please try again.</p>}
      {withdraw.isError && <p className='text-sm text-destructive'>Couldn&apos;t withdraw. Please try again.</p>}
    </div>
  )
}
