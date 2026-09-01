import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_PAYWALL_SELECT } from './selects/nest-paywall.select'

export interface NestPaywallUpsertData {
  isPaywalled: boolean
  stripePriceId?: string
  priceAmountCents?: number
}

@Injectable()
export class NestPaywallRepository {
  constructor(private readonly prisma: PrismaService) { }

  get(nestId: string, db: Database = this.prisma) {
    return db.nestPaywall.findUnique({ where: { nestId }, select: NEST_PAYWALL_SELECT })
  }

  upsert(nestId: string, data: NestPaywallUpsertData, db: Database = this.prisma) {
    return db.nestPaywall.upsert({
      where: { nestId },
      create: { nestId, ...data },
      update: data,
      select: NEST_PAYWALL_SELECT
    })
  }
}
