import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'
import { BillingConfig } from './billing.config'

interface CreateCheckoutSessionOptions {
  priceId: string
  customerEmail: string
  returnUrl: string
  metadata: Record<string, string>
}

interface CreateAccountLinkOptions {
  accountId: string
  refreshUrl: string
  returnUrl: string
}

/**
 * Thin wrapper around the Stripe SDK — every method is a direct pass-through to one Stripe API
 * call, with no business logic of its own. Domain services own the actual
 * paywall/subscription/payout logic and call through here.
 */
@Injectable()
export class StripeService {
  private readonly client: Stripe
  private readonly webhookSecret: string

  constructor(config: ConfigService<BillingConfig>) {
    this.client = new Stripe(config.getOrThrow('stripeSecretKey', { infer: true }))
    this.webhookSecret = config.getOrThrow('stripeWebhookSecret', { infer: true })
  }

  /** @param stripeSubscriptionId - The Stripe subscription to cancel. */
  async cancelSubscription(stripeSubscriptionId: string) {
    await this.client.subscriptions.cancel(stripeSubscriptionId)
  }

  /**
   * Creates a new recurring monthly price. Stripe prices are immutable — there's no
   * `updatePrice`; changing a price means creating a new one instead.
   *
   * @param productName - The Stripe product name shown on the customer's invoice/checkout.
   * @param amountCents - The monthly price, in cents (USD).
   * @returns The new price's Stripe id.
   */
  async createPrice(productName: string, amountCents: number): Promise<string> {
    const price = await this.client.prices.create({
      currency: 'usd',
      unit_amount: amountCents,
      recurring: { interval: 'month' },
      product_data: { name: productName }
    })

    return price.id
  }

  /**
   * Creates an embedded Stripe Checkout session for a subscription purchase.
   *
   * @param options - Price, customer email, post-checkout return URL, and metadata (used to
   * correlate the resulting webhook events back to the nest/subscriber).
   * @returns The session's `client_secret`, used to mount Stripe's embedded checkout UI.
   */
  async createCheckoutSession(options: CreateCheckoutSessionOptions): Promise<string> {
    const session = await this.client.checkout.sessions.create({
      mode: 'subscription',
      ui_mode: 'embedded_page',
      line_items: [{ price: options.priceId, quantity: 1 }],
      customer_email: options.customerEmail,
      return_url: options.returnUrl,
      metadata: options.metadata
    })

    return session.client_secret!
  }

  /** @param stripeSubscriptionId - The Stripe subscription to fetch. */
  retrieveSubscription(stripeSubscriptionId: string) {
    return this.client.subscriptions.retrieve(stripeSubscriptionId)
  }

  /**
   * Creates a Stripe Express connected account, used as a payout destination for nest owners.
   *
   * @param email - The account holder's email, prefilled into Stripe's onboarding flow.
   * @returns The new connected account's Stripe id.
   */
  async createConnectedAccount(email: string): Promise<string> {
    const account = await this.client.accounts.create({
      type: 'express',
      email,
      capabilities: { transfers: { requested: true } }
    })

    return account.id
  }

  /**
   * Creates a one-time link to Stripe's hosted onboarding flow for a connected account.
   *
   * @param options - The account to onboard, plus the refresh URL (if the link expires) and
   * return URL (after onboarding completes).
   * @returns The onboarding URL to redirect the user to.
   */
  createAccountLink(options: CreateAccountLinkOptions): Promise<string> {
    return this.client.accountLinks.create({
      account: options.accountId,
      refresh_url: options.refreshUrl,
      return_url: options.returnUrl,
      type: 'account_onboarding'
    }).then((link) => link.url)
  }

  /** @param accountId - The Stripe connected account to fetch. */
  retrieveAccount(accountId: string) {
    return this.client.accounts.retrieve(accountId)
  }

  /**
   * Pays out to a connected account from the platform's Stripe balance.
   *
   * @param accountId - The destination connected account.
   * @param amountCents - The transfer amount, in cents (USD).
   * @returns The created transfer's Stripe id.
   */
  async createTransfer(accountId: string, amountCents: number): Promise<string> {
    const transfer = await this.client.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: accountId
    })

    return transfer.id
  }

  /**
   * Verifies and parses an incoming Stripe webhook payload. Verification (not just parsing) is
   * what makes it safe to trust the event's contents as actually coming from Stripe.
   *
   * @param payload - The raw request body, exactly as received (signature verification requires
   * the unparsed bytes).
   * @param signature - The `Stripe-Signature` request header.
   * @returns The verified, typed Stripe event.
   * @throws {Stripe.errors.StripeSignatureVerificationError} The signature doesn't match the payload.
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.client.webhooks.constructEvent(payload, signature, this.webhookSecret)
  }
}
