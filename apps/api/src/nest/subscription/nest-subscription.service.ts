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

/**
 * A user's paid subscription to a paywalled nest. Most of this class's state is driven by Stripe
 * webhooks, not by direct user action — `syncFromStripe`, `createFromCheckoutCompleted`, and
 * `markCanceledByStripeId` are only ever called from webhook handling, never directly.
 */
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

  /**
   * @param nestSlug - The nest to subscribe to.
   * @param actorUserId - The subscribing user.
   * @param actorEmail - Prefilled on the Stripe checkout page.
   * @returns The client secret for Stripe's embedded checkout.
   * @throws {NestNotPaywalledException} This nest has no paywall configured.
   * @throws {AlreadySubscribedException} `actorUserId` already has an active subscription.
   */
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

  /**
   * Called from the `checkout.session.completed` webhook — fetches the subscription from Stripe
   * to capture its initial status/period rather than assuming it's active.
   *
   * @param nestId - The subscribed-to nest.
   * @param userId - The subscribing user.
   * @param stripeSubscriptionId - The Stripe subscription just created.
   * @param stripeCustomerId - The Stripe customer who created it.
   */
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

  /** Applies a `customer.subscription.updated` webhook payload. */
  async syncFromStripe(stripeSubscriptionId: string, stripeStatus: Stripe.Subscription.Status, currentPeriodEndUnix: number, cancelAtPeriodEnd: boolean) {
    await this.subscriptionsRepo.updateFromStripe(stripeSubscriptionId, {
      status: toNestSubscriptionStatus(stripeStatus),
      currentPeriodEnd: new Date(currentPeriodEndUnix * 1000),
      cancelAtPeriodEnd
    })
  }

  /** Applies a `customer.subscription.deleted` webhook payload. */
  async markCanceledByStripeId(stripeSubscriptionId: string) {
    await this.subscriptionsRepo.markCanceledByStripeId(stripeSubscriptionId)
  }

  /** @returns The nest a Stripe subscription belongs to, or null if unrecognized. */
  async findNestIdByStripeSubscriptionId(stripeSubscriptionId: string) {
    const subscription = await this.subscriptionsRepo.findByStripeSubscriptionId(stripeSubscriptionId)

    return subscription?.nestId ?? null
  }

  /**
   * @param nestSlug - The nest to check.
   * @param actorUserId - The user whose subscription to look up.
   * @returns The active subscription's status, or null if there isn't one.
   */
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

  /**
   * Cancels at Stripe first, then marks canceled locally — so a Stripe failure never leaves the
   * local record out of sync with what the user was actually billed for.
   *
   * @param nestSlug - The nest to cancel a subscription to.
   * @param actorUserId - The subscriber.
   * @throws {NoActiveSubscriptionException} `actorUserId` has no active subscription to cancel.
   */
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

  /**
   * Cancels every active subscription to a nest — for when the nest itself is deleted. Failures
   * are logged per-subscription rather than aborting the whole sweep, since one bad Stripe call
   * shouldn't block canceling the rest.
   *
   * @param nestId - The deleted nest whose subscriptions to wind down.
   */
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
