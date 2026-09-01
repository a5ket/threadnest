import { Injectable } from '@nestjs/common'
import { NestSubscriptionStatus } from 'generated/prisma/enums'
import { PinoLogger } from 'nestjs-pino'
import { StripeService } from 'src/billing/stripe.service'
import { UrlBuilder } from 'src/url/url.builder'
import type Stripe from 'stripe'
import { NestPaywallRepository } from '../paywall/nest-paywall.repository'
import { NestRepository } from '../nest.repository'
import { AlreadySubscribedException } from './exceptions/already-subscribed.exception'
import { NestNotPaywalledException } from './exceptions/nest-not-paywalled.exception'
import { NoActiveSubscriptionException } from './exceptions/no-active-subscription.exception'
import { toNestSubscriptionStatus } from './nest-subscription-status.mapper'
import { NestSubscriptionRepository } from './nest-subscription.repository'

export interface NestSubscriptionView {
  status: NestSubscriptionStatus
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  priceAmountCents: number | null
}

@Injectable()
export class NestSubscriptionService {
  constructor(
    private readonly subscriptionsRepo: NestSubscriptionRepository,
    private readonly paywallRepo: NestPaywallRepository,
    private readonly nestsRepo: NestRepository,
    private readonly stripe: StripeService,
    private readonly urls: UrlBuilder,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(NestSubscriptionService.name)
  }

  async createCheckoutSession(nestSlug: string, actorUserId: string, actorEmail: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)
    const paywall = await this.paywallRepo.get(nest.id)

    if (!paywall?.isPaywalled || !paywall.stripePriceId) {
      throw new NestNotPaywalledException()
    }

    if (await this.subscriptionsRepo.existsActiveForUser(nest.id, actorUserId)) {
      throw new AlreadySubscribedException()
    }

    const clientSecret = await this.stripe.createCheckoutSession({
      priceId: paywall.stripePriceId,
      customerEmail: actorEmail,
      returnUrl: this.urls.nestCheckoutReturn(nestSlug),
      metadata: { nestId: nest.id, userId: actorUserId }
    })

    return { clientSecret }
  }

  async createFromCheckoutCompleted(nestId: string, userId: string, stripeSubscriptionId: string, stripeCustomerId: string) {
    const subscription = await this.stripe.retrieveSubscription(stripeSubscriptionId)

    await this.subscriptionsRepo.create({
      nestId,
      userId,
      stripeSubscriptionId,
      stripeCustomerId,
      status: toNestSubscriptionStatus(subscription.status),
      currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    })

    this.logger.info({ nestId, userId, stripeSubscriptionId }, 'Nest subscription created')
  }

  async syncFromStripe(stripeSubscriptionId: string, stripeStatus: Stripe.Subscription.Status, currentPeriodEndUnix: number, cancelAtPeriodEnd: boolean) {
    await this.subscriptionsRepo.updateFromStripe(stripeSubscriptionId, {
      status: toNestSubscriptionStatus(stripeStatus),
      currentPeriodEnd: new Date(currentPeriodEndUnix * 1000),
      cancelAtPeriodEnd
    })
  }

  async markCanceledByStripeId(stripeSubscriptionId: string) {
    await this.subscriptionsRepo.markCanceledByStripeId(stripeSubscriptionId)
  }

  async findNestIdByStripeSubscriptionId(stripeSubscriptionId: string) {
    const subscription = await this.subscriptionsRepo.findByStripeSubscriptionId(stripeSubscriptionId)

    return subscription?.nestId ?? null
  }

  async getForActor(nestSlug: string, actorUserId: string): Promise<NestSubscriptionView | null> {
    const nest = await this.nestsRepo.getBySlug(nestSlug)
    const subscription = await this.subscriptionsRepo.findActiveByUser(nest.id, actorUserId)

    if (!subscription) return null

    const paywall = await this.paywallRepo.get(nest.id)

    return {
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      priceAmountCents: paywall?.priceAmountCents ?? null
    }
  }

  async cancel(nestSlug: string, actorUserId: string): Promise<NestSubscriptionView> {
    const nest = await this.nestsRepo.getBySlug(nestSlug)
    const subscription = await this.subscriptionsRepo.findActiveByUser(nest.id, actorUserId)

    if (!subscription) {
      throw new NoActiveSubscriptionException()
    }

    await this.stripe.cancelSubscription(subscription.stripeSubscriptionId)
    const canceled = await this.subscriptionsRepo.markCanceled(subscription.id)

    this.logger.info({ nestId: nest.id, actorUserId, subscriptionId: subscription.id }, 'Nest subscription canceled by user')

    const paywall = await this.paywallRepo.get(nest.id)

    return {
      status: canceled.status,
      currentPeriodEnd: canceled.currentPeriodEnd,
      cancelAtPeriodEnd: canceled.cancelAtPeriodEnd,
      priceAmountCents: paywall?.priceAmountCents ?? null
    }
  }

  async cancelAllForNest(nestId: string) {
    const subscriptions = await this.subscriptionsRepo.listActiveByNest(nestId)

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        await this.stripe.cancelSubscription(subscription.stripeSubscriptionId)
        await this.subscriptionsRepo.markCanceled(subscription.id)
      })
    )

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        this.logger.error({ nestId, subscriptionId: subscriptions[i].id, err: result.reason as Error }, 'Failed to cancel nest subscription')
      }
    })
  }
}
