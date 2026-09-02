'use client'

import { Badge, type BadgeVariant } from '@/common/components/badge'
import { NestAvatar } from '@/common/components/nest-avatar'
import { DemoBanner } from '@/common/components/demo-banner'
import { formatDate } from '@/common/format-date'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { nestSubscriptionQueryKey, useCancelNestSubscription, useNestSubscription, useNestSubscriptionCheckout } from '../paywall.hooks'
import { NestCheckoutEmbed } from './nest-checkout-embed'

interface NestCheckoutPageProps {
  nestSlug: string
  nestName: string
  nestIconUrl: string | null
  priceAmountCents: number | null
}

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  TRIALING: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'neutral',
  UNPAID: 'destructive'
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  TRIALING: 'Trialing',
  PAST_DUE: 'Past due',
  CANCELED: 'Canceled',
  UNPAID: 'Unpaid'
}

export function NestCheckoutPage({ nestSlug, nestName, nestIconUrl, priceAmountCents }: NestCheckoutPageProps) {
  const { data: subscription, isLoading } = useNestSubscription(nestSlug)
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('checkout') !== 'complete') return

    queryClient.invalidateQueries({ queryKey: nestSubscriptionQueryKey(nestSlug) })
    router.replace(`/n/${nestSlug}/subscribe`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className='flex w-full max-w-3xl flex-col gap-8 p-6 md:flex-row md:gap-12 md:py-16'>
      <div className='flex shrink-0 flex-col gap-3 md:w-64'>
        <Link href={`/n/${nestSlug}`} className='text-sm text-muted-foreground hover:underline'>
          ← Back to
          {' '}
          {nestName}
        </Link>

        <NestAvatar name={nestName} slug={nestSlug} iconUrl={nestIconUrl} size={48} />

        <div>
          <h1 className='text-lg font-semibold'>{nestName}</h1>
          {priceAmountCents !== null && (
            <p className='text-sm text-muted-foreground'>
              $
              {(priceAmountCents / 100).toFixed(2)}
              {' '}
              / month
            </p>
          )}
        </div>

        <p className='text-sm text-muted-foreground'>
          Subscribing gives you full access to this nest&apos;s threads and discussions for as long as you stay subscribed.
        </p>
      </div>

      <div className='flex min-w-0 flex-1 flex-col gap-4'>
        <DemoBanner />

        {isLoading && <p className='p-6 text-center text-sm text-muted-foreground'>Loading...</p>}

        {!isLoading && subscription && (
          <ExistingSubscription nestSlug={nestSlug} subscription={subscription} />
        )}

        {!isLoading && !subscription && (
          <NewCheckout nestSlug={nestSlug} />
        )}
      </div>
    </div>
  )
}

interface ExistingSubscriptionProps {
  nestSlug: string
  subscription: {
    status: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    priceAmountCents: number | null
  }
}

function ExistingSubscription({ nestSlug, subscription }: ExistingSubscriptionProps) {
  const queryClient = useQueryClient()
  const cancel = useCancelNestSubscription({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: nestSubscriptionQueryKey(nestSlug) })
  })

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-sm'>
      <div className='flex items-center justify-between'>
        <span className='font-medium'>Status</span>
        <Badge variant={STATUS_VARIANTS[subscription.status] ?? 'neutral'}>
          {STATUS_LABELS[subscription.status] ?? subscription.status}
        </Badge>
      </div>

      {subscription.priceAmountCents !== null && (
        <div className='flex items-center justify-between'>
          <span className='font-medium'>Price</span>
          <span>
            $
            {(subscription.priceAmountCents / 100).toFixed(2)}
            /month
          </span>
        </div>
      )}

      <div className='flex items-center justify-between'>
        <span className='font-medium'>
          {subscription.cancelAtPeriodEnd ? 'Access ends' : 'Renews'}
        </span>
        <span>{formatDate(subscription.currentPeriodEnd)}</span>
      </div>

      {!subscription.cancelAtPeriodEnd && (
        <button
          type='button'
          disabled={cancel.isPending}
          onClick={() => cancel.mutate(nestSlug)}
          className='mt-2 rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50'
        >
          {cancel.isPending ? 'Canceling...' : 'Cancel subscription'}
        </button>
      )}

      {cancel.isError && <p className='text-sm text-destructive'>Couldn&apos;t cancel. Please try again.</p>}
    </div>
  )
}

function NewCheckout({ nestSlug }: { nestSlug: string }) {
  const checkout = useNestSubscriptionCheckout()

  useEffect(() => {
    checkout.mutate(nestSlug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nestSlug])

  return (
    <div className='overflow-hidden rounded-lg border border-border'>
      {checkout.isPending && <p className='p-6 text-center text-sm text-muted-foreground'>Loading checkout...</p>}
      {checkout.isError && <p className='p-6 text-center text-sm text-destructive'>Couldn&apos;t start checkout. Please try again.</p>}
      {checkout.data && <NestCheckoutEmbed clientSecret={checkout.data.clientSecret} />}
    </div>
  )
}
