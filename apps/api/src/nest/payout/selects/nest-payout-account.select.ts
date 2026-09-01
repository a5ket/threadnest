import { Prisma } from 'generated/prisma/client'

export const NEST_PAYOUT_ACCOUNT_SELECT = {
  stripeAccountId: true,
  chargesEnabled: true,
  payoutsEnabled: true
} satisfies Prisma.NestPayoutAccountSelect
