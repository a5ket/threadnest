'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { nestPaywallQueryKey, useDisableNestPaywall, useNestPaywall, useSetNestPaywallPrice } from '../paywall.hooks'

interface NestPaywallSettingsProps {
  nestSlug: string
}

export function NestPaywallSettings({ nestSlug }: NestPaywallSettingsProps) {
  const { data: paywall, isLoading } = useNestPaywall(nestSlug)
  const [amount, setAmount] = useState('5.00')
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: nestPaywallQueryKey(nestSlug) })

  const setPrice = useSetNestPaywallPrice({ onSuccess: invalidate })
  const disable = useDisableNestPaywall({ onSuccess: invalidate })

  if (isLoading || !paywall) return null

  const handleSetPrice = (e: React.FormEvent) => {
    e.preventDefault()

    const amountCents = Math.round(parseFloat(amount) * 100)
    if (!Number.isFinite(amountCents) || amountCents < 100) return

    setPrice.mutate({ nestSlug, amountCents })
  }

  return (
    <div className='flex flex-col gap-3 rounded-md border border-border p-4'>
      <div>
        <h2 className='text-sm font-semibold'>Subscription price</h2>
        <p className='text-xs text-muted-foreground'>Charge members a monthly subscription to view this nest.</p>
      </div>

      {paywall.isPaywalled
        ? (
            <div className='flex items-center justify-between gap-4 rounded-md border border-border p-3 text-sm'>
              <span>
                Paywalled at $
                {((paywall.priceAmountCents ?? 0) / 100).toFixed(2)}
                /month
              </span>
              <button
                type='button'
                disabled={disable.isPending}
                onClick={() => disable.mutate(nestSlug)}
                className='text-destructive hover:underline disabled:opacity-50'
              >
                Disable
              </button>
            </div>
          )
        : (
            <form onSubmit={handleSetPrice} className='flex items-end gap-2'>
              <div className='flex flex-col gap-1.5'>
                <label htmlFor='paywall-price' className='text-sm font-medium'>
                  Monthly price (USD)
                </label>
                <input
                  id='paywall-price'
                  type='number'
                  min='1'
                  step='0.01'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className='w-32 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'
                />
              </div>

              <button
                type='submit'
                disabled={setPrice.isPending}
                className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
              >
                {setPrice.isPending ? 'Enabling...' : 'Enable paywall'}
              </button>
            </form>
          )}
    </div>
  )
}
