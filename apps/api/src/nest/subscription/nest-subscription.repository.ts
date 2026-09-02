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

/** Persistence for nest subscriptions. */
@Injectable()
export class NestSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param nestId - The nest whose active subscriptions to list.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns Minimal identifying info (id + Stripe subscription id) for every currently-active
   * subscription to this nest — for bulk cancellation when the nest itself is deleted.
   */
  listActiveByNest(nestId: string, db: Database = this.prisma) {
    return db.nestSubscription.findMany({
      where: { nestId, status: { in: NEST_SUBSCRIPTION_ACTIVE_STATUSES } },
      select: { id: true, stripeSubscriptionId: true }
    })
  }

  /**
   * @param nestId - The nest to check.
   * @param userId - The user to check.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns Whether `userId` has a currently-active subscription to `nestId`.
   */
  async existsActiveForUser(nestId: string, userId: string, db: Database = this.prisma) {
    const subscription = await db.nestSubscription.findFirst({
      where: { nestId, userId, status: { in: NEST_SUBSCRIPTION_ACTIVE_STATUSES } },
      select: { id: true }
    })

    return Boolean(subscription)
  }

  /**
   * @param nestId - The nest to check.
   * @param userId - The user to check.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The user's active subscription details, or `null` if they have none.
   */
  findActiveByUser(nestId: string, userId: string, db: Database = this.prisma) {
    return db.nestSubscription.findFirst({
      where: { nestId, userId, status: { in: NEST_SUBSCRIPTION_ACTIVE_STATUSES } },
      select: { id: true, stripeSubscriptionId: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true }
    })
  }

  /**
   * @param data - The subscription's initial state, from a completed Stripe checkout session.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created subscription.
   */
  create(data: NestSubscriptionCreateData, db: Database = this.prisma) {
    return db.nestSubscription.create({ data })
  }

  /**
   * @param stripeSubscriptionId - The Stripe subscription id to look up.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The matching subscription's id and nest, or `null` if none matches.
   */
  findByStripeSubscriptionId(stripeSubscriptionId: string, db: Database = this.prisma) {
    return db.nestSubscription.findUnique({
      where: { stripeSubscriptionId },
      select: { id: true, nestId: true }
    })
  }

  /**
   * Applies a Stripe webhook's subscription-status payload.
   *
   * @param stripeSubscriptionId - Identifies which subscription to update.
   * @param data - The new status, period end, and cancel-at-period-end flag.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The updated subscription.
   */
  updateFromStripe(stripeSubscriptionId: string, data: NestSubscriptionStripeSyncData, db: Database = this.prisma) {
    return db.nestSubscription.update({ where: { stripeSubscriptionId }, data })
  }

  /**
   * @param id - The subscription's own id.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The updated subscription.
   */
  markCanceled(id: string, db: Database = this.prisma) {
    return db.nestSubscription.update({
      where: { id },
      data: { status: NestSubscriptionStatus.CANCELED, cancelAtPeriodEnd: false }
    })
  }

  /**
   * Same as {@link markCanceled}, but looked up by Stripe subscription id instead of the row's
   * own id — for the webhook path, where only the Stripe id is known.
   *
   * @param stripeSubscriptionId - The Stripe subscription id to look up.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The updated subscription.
   */
  markCanceledByStripeId(stripeSubscriptionId: string, db: Database = this.prisma) {
    return db.nestSubscription.update({
      where: { stripeSubscriptionId },
      data: { status: NestSubscriptionStatus.CANCELED, cancelAtPeriodEnd: false }
    })
  }
}
