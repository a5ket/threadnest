import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_PAYOUT_ACCOUNT_SELECT } from './selects/nest-payout-account.select'

export interface NestPayoutAccountUpdateData {
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

/** Persistence for a nest's connected Stripe Express payout account. */
@Injectable()
export class NestPayoutAccountRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param nestId - The nest to look up.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The payout account, or `null` if the nest has never onboarded one.
   */
  get(nestId: string, db: Database = this.prisma) {
    return db.nestPayoutAccount.findUnique({ where: { nestId }, select: NEST_PAYOUT_ACCOUNT_SELECT })
  }

  /**
   * @param nestId - The nest to create a payout account for.
   * @param stripeAccountId - The newly created Stripe Express connected account's id.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created account.
   */
  create(nestId: string, stripeAccountId: string, db: Database = this.prisma) {
    return db.nestPayoutAccount.create({
      data: { nestId, stripeAccountId },
      select: NEST_PAYOUT_ACCOUNT_SELECT
    })
  }

  /**
   * @returns The updated account, or null if `stripeAccountId` doesn't match a known account
   *   (e.g. a stale/foreign webhook).
   */
  async updateByStripeAccountId(stripeAccountId: string, data: NestPayoutAccountUpdateData, db: Database = this.prisma) {
    try {
      return await db.nestPayoutAccount.update({
        where: { stripeAccountId },
        data,
        select: { nestId: true, ...NEST_PAYOUT_ACCOUNT_SELECT }
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        return null
      }

      throw error
    }
  }
}
