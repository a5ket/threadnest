import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { StripeService } from 'src/billing/stripe.service'
import type Stripe from 'stripe'
import { NestLedgerService } from '../../ledger/nest-ledger.service'
import { NestPayoutService } from '../../payout/nest-payout.service'
import { NestSubscriptionService } from '../nest-subscription.service'

/**
 * Single entry point for every Stripe webhook event this app cares about — subscription
 * checkout, billing, cancellation, and Connect account status. Unrecognized event types are
 * silently ignored rather than erroring, since Stripe sends many event types this app doesn't act on.
 */
@Injectable()
export class StripeWebhookService {
  constructor(
    private readonly stripe: StripeService,
    private readonly subscriptions: NestSubscriptionService,
    private readonly ledger: NestLedgerService,
    private readonly payout: NestPayoutService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(StripeWebhookService.name)
  }

  /**
   * @param payload - The raw (unparsed) request body — required by Stripe's signature check.
   * @param signature - The `Stripe-Signature` request header.
   * @throws {Error} (from the Stripe SDK) The signature doesn't verify against the raw payload.
   */
  async handle(payload: Buffer, signature: string) {
    const event = this.stripe.constructWebhookEvent(payload, signature)

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object)
        break
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object)
        break
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object)
        break
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object)
        break
      default:
        break
    }
  }

  /**
   * Ignores (logs and returns) a session missing our own metadata rather than throwing — a
   * malformed webhook shouldn't 500.
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const nestId = session.metadata?.nestId
    const userId = session.metadata?.userId
    const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

    if (!nestId || !userId || !stripeSubscriptionId || !stripeCustomerId) {
      this.logger.error({ sessionId: session.id }, 'checkout.session.completed missing required metadata')
      return
    }

    await this.subscriptions.createFromCheckoutCompleted(nestId, userId, stripeSubscriptionId, stripeCustomerId)
  }

  /** Credits the nest's ledger for a successful subscription charge (the actual revenue event). */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscription = invoice.parent?.subscription_details?.subscription
    const stripeSubscriptionId = typeof subscription === 'string' ? subscription : subscription?.id

    if (!stripeSubscriptionId) return

    const nestId = await this.subscriptions.findNestIdByStripeSubscriptionId(stripeSubscriptionId)
    if (!nestId) return

    await this.ledger.creditCharge(nestId, invoice.amount_paid, invoice.id ?? `${stripeSubscriptionId}:${invoice.created}`)
  }

  /** Covers status changes (past_due, trial ending, etc.) and cancel-at-period-end toggles. */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end

    if (!currentPeriodEnd) return

    await this.subscriptions.syncFromStripe(subscription.id, subscription.status, currentPeriodEnd, subscription.cancel_at_period_end)
  }

  /** Fires when a subscription actually ends (vs. `cancel_at_period_end` being set, which is an update). */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.subscriptions.markCanceledByStripeId(subscription.id)
  }

  /** Tracks a nest owner's Connect onboarding progress (charges/payouts becoming enabled). */
  private async handleAccountUpdated(account: Stripe.Account) {
    await this.payout.syncFromStripe(account.id, account.charges_enabled, account.payouts_enabled)
  }
}
