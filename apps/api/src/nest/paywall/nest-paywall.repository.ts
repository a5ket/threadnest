import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_PAYWALL_SELECT } from './selects/nest-paywall.select'

export interface NestPaywallUpsertData {
  isPaywalled: boolean
  stripePriceId?: string
  priceAmountCents?: number
}

/** Persistence for a nest's paywall configuration. */
@Injectable()
export class NestPaywallRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param nestId - The nest to look up.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The paywall config, or `null` if the nest has never had one configured.
   */
  get(nestId: string, db: Database = this.prisma) {
    return db.nestPaywall.findUnique({ where: { nestId }, select: NEST_PAYWALL_SELECT })
  }

  /**
   * @param nestId - The nest to configure.
   * @param data - The paywall state to set.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The upserted paywall config.
   */
  upsert(nestId: string, data: NestPaywallUpsertData, db: Database = this.prisma) {
    return db.nestPaywall.upsert({
      where: { nestId },
      create: { nestId, ...data },
      update: data,
      select: NEST_PAYWALL_SELECT
    })
  }
}
