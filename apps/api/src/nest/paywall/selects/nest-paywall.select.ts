import { Prisma } from 'generated/prisma/client'

export const NEST_PAYWALL_SELECT = {
  isPaywalled: true,
  stripePriceId: true,
  priceAmountCents: true
} satisfies Prisma.NestPaywallSelect
