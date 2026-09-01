import { NestSubscriptionStatus } from 'generated/prisma/enums'

export const NEST_SUBSCRIPTION_ACTIVE_STATUSES = [
  NestSubscriptionStatus.ACTIVE,
  NestSubscriptionStatus.TRIALING,
  NestSubscriptionStatus.PAST_DUE
]
