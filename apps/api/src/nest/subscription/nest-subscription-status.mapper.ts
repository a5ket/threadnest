import { NestSubscriptionStatus } from 'generated/prisma/enums'
import type Stripe from 'stripe'

const STATUS_MAP: Record<Stripe.Subscription.Status, NestSubscriptionStatus> = {
  active: NestSubscriptionStatus.ACTIVE,
  trialing: NestSubscriptionStatus.TRIALING,
  past_due: NestSubscriptionStatus.PAST_DUE,
  canceled: NestSubscriptionStatus.CANCELED,
  unpaid: NestSubscriptionStatus.UNPAID,
  incomplete: NestSubscriptionStatus.UNPAID,
  incomplete_expired: NestSubscriptionStatus.CANCELED,
  paused: NestSubscriptionStatus.CANCELED
}

export function toNestSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): NestSubscriptionStatus {
  return STATUS_MAP[stripeStatus]
}
