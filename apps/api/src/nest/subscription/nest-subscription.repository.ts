import { Injectable } from '@nestjs/common'
import { NestSubscriptionStatus } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_SUBSCRIPTION_ACTIVE_STATUSES } from './constants/nest-subscription-active-statuses'

export interface NestSubscriptionCreateData {
  nestId: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: NestSubscriptionStatus
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

export interface NestSubscriptionStripeSyncData {
  status: NestSubscriptionStatus
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

@Injectable()
export class NestSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) { }

  listActiveByNest(nestId: string, db: Database = this.prisma) {
    return db.nestSubscription.findMany({
      where: { nestId, status: { in: NEST_SUBSCRIPTION_ACTIVE_STATUSES } },
      select: { id: true, stripeSubscriptionId: true }
    })
  }

  async existsActiveForUser(nestId: string, userId: string, db: Database = this.prisma) {
    const subscription = await db.nestSubscription.findFirst({
      where: { nestId, userId, status: { in: NEST_SUBSCRIPTION_ACTIVE_STATUSES } },
      select: { id: true }
    })

    return Boolean(subscription)
  }

  findActiveByUser(nestId: string, userId: string, db: Database = this.prisma) {
    return db.nestSubscription.findFirst({
      where: { nestId, userId, status: { in: NEST_SUBSCRIPTION_ACTIVE_STATUSES } },
      select: { id: true, stripeSubscriptionId: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true }
    })
  }

  create(data: NestSubscriptionCreateData, db: Database = this.prisma) {
    return db.nestSubscription.create({ data })
  }

  findByStripeSubscriptionId(stripeSubscriptionId: string, db: Database = this.prisma) {
    return db.nestSubscription.findUnique({
      where: { stripeSubscriptionId },
      select: { id: true, nestId: true }
    })
  }

  updateFromStripe(stripeSubscriptionId: string, data: NestSubscriptionStripeSyncData, db: Database = this.prisma) {
    return db.nestSubscription.update({ where: { stripeSubscriptionId }, data })
  }

  markCanceled(id: string, db: Database = this.prisma) {
    return db.nestSubscription.update({
      where: { id },
      data: { status: NestSubscriptionStatus.CANCELED, cancelAtPeriodEnd: false }
    })
  }

  markCanceledByStripeId(stripeSubscriptionId: string, db: Database = this.prisma) {
    return db.nestSubscription.update({
      where: { stripeSubscriptionId },
      data: { status: NestSubscriptionStatus.CANCELED, cancelAtPeriodEnd: false }
    })
  }
}
