'use client'

import { env } from '@/config/env'
import { loadStripe, type Stripe as StripeJs, type StripeEmbeddedCheckout } from '@stripe/stripe-js'
import { useEffect, useRef } from 'react'

let stripePromise: Promise<StripeJs | null> | null = null

function getStripe() {
  stripePromise ??= loadStripe(env.stripePublishableKey)
  return stripePromise
}

interface NestCheckoutEmbedProps {
  clientSecret: string
}

export function NestCheckoutEmbed({ clientSecret }: NestCheckoutEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null)

  useEffect(() => {
    let cancelled = false

    void getStripe().then(async (stripe) => {
      if (!stripe || cancelled || !containerRef.current) return

      const checkout = await stripe.createEmbeddedCheckoutPage({ clientSecret })

      if (cancelled) {
        checkout.destroy()
        return
      }

      checkoutRef.current = checkout
      checkout.mount(containerRef.current)
    })

    return () => {
      cancelled = true
      checkoutRef.current?.destroy()
      checkoutRef.current = null
    }
  }, [clientSecret])

  return <div ref={containerRef} />
}
