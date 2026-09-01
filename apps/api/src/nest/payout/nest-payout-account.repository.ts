import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_PAYOUT_ACCOUNT_SELECT } from './selects/nest-payout-account.select'

export interface NestPayoutAccountUpdateData {
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

@Injectable()
export class NestPayoutAccountRepository {
  constructor(private readonly prisma: PrismaService) { }

  get(nestId: string, db: Database = this.prisma) {
    return db.nestPayoutAccount.findUnique({ where: { nestId }, select: NEST_PAYOUT_ACCOUNT_SELECT })
  }

  create(nestId: string, stripeAccountId: string, db: Database = this.prisma) {
    return db.nestPayoutAccount.create({
      data: { nestId, stripeAccountId },
      select: NEST_PAYOUT_ACCOUNT_SELECT
    })
  }

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
