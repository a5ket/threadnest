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

@Injectable()
export class StripeService {
  private readonly client: Stripe
  private readonly webhookSecret: string

  constructor(config: ConfigService<BillingConfig>) {
    this.client = new Stripe(config.getOrThrow('stripeSecretKey', { infer: true }))
    this.webhookSecret = config.getOrThrow('stripeWebhookSecret', { infer: true })
  }

  async cancelSubscription(stripeSubscriptionId: string) {
    await this.client.subscriptions.cancel(stripeSubscriptionId)
  }

  async createPrice(productName: string, amountCents: number): Promise<string> {
    const price = await this.client.prices.create({
      currency: 'usd',
      unit_amount: amountCents,
      recurring: { interval: 'month' },
      product_data: { name: productName }
    })

    return price.id
  }

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

  retrieveSubscription(stripeSubscriptionId: string) {
    return this.client.subscriptions.retrieve(stripeSubscriptionId)
  }

  async createConnectedAccount(email: string): Promise<string> {
    const account = await this.client.accounts.create({
      type: 'express',
      email,
      capabilities: { transfers: { requested: true } }
    })

    return account.id
  }

  createAccountLink(options: CreateAccountLinkOptions): Promise<string> {
    return this.client.accountLinks.create({
      account: options.accountId,
      refresh_url: options.refreshUrl,
      return_url: options.returnUrl,
      type: 'account_onboarding'
    }).then((link) => link.url)
  }

  retrieveAccount(accountId: string) {
    return this.client.accounts.retrieve(accountId)
  }

  async createTransfer(accountId: string, amountCents: number): Promise<string> {
    const transfer = await this.client.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: accountId
    })

    return transfer.id
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.client.webhooks.constructEvent(payload, signature, this.webhookSecret)
  }
}
