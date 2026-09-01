import { StripeWebhookService } from './stripe-webhook.service'

describe('StripeWebhookService', () => {
  const stripe = { constructWebhookEvent: jest.fn() }
  const subscriptions = {
    createFromCheckoutCompleted: jest.fn(),
    findNestIdByStripeSubscriptionId: jest.fn(),
    syncFromStripe: jest.fn(),
    markCanceledByStripeId: jest.fn()
  }
  const ledger = { creditCharge: jest.fn() }
  const payout = { syncFromStripe: jest.fn() }
  const logger = { setContext: jest.fn(), error: jest.fn() }

  const service = new StripeWebhookService(stripe as any, subscriptions as any, ledger as any, payout as any, logger as any)

  const payload = Buffer.from('{}')
  const signature = 'sig_test'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a subscription from checkout.session.completed', async () => {
    stripe.constructWebhookEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'session-1',
          metadata: { nestId: 'nest-1', userId: 'user-1' },
          subscription: 'stripe-sub-1',
          customer: 'stripe-cus-1'
        }
      }
    })

    await service.handle(payload, signature)

    expect(subscriptions.createFromCheckoutCompleted).toHaveBeenCalledWith('nest-1', 'user-1', 'stripe-sub-1', 'stripe-cus-1')
  })

  it('logs and skips checkout.session.completed when required fields are missing', async () => {
    stripe.constructWebhookEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'session-1', metadata: {}, subscription: null, customer: null } }
    })

    await service.handle(payload, signature)

    expect(subscriptions.createFromCheckoutCompleted).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalled()
  })

  it('credits the nest ledger from invoice.paid', async () => {
    stripe.constructWebhookEvent.mockReturnValue({
      type: 'invoice.paid',
      data: {
        object: {
          id: 'invoice-1',
          amount_paid: 500,
          created: 1_700_000_000,
          parent: { subscription_details: { subscription: 'stripe-sub-1' } }
        }
      }
    })
    subscriptions.findNestIdByStripeSubscriptionId.mockResolvedValue('nest-1')

    await service.handle(payload, signature)

    expect(ledger.creditCharge).toHaveBeenCalledWith('nest-1', 500, 'invoice-1')
  })

  it('does not credit the ledger when the subscription has no matching nest', async () => {
    stripe.constructWebhookEvent.mockReturnValue({
      type: 'invoice.paid',
      data: {
        object: {
          id: 'invoice-1',
          amount_paid: 500,
          created: 1_700_000_000,
          parent: { subscription_details: { subscription: 'stripe-sub-1' } }
        }
      }
    })
    subscriptions.findNestIdByStripeSubscriptionId.mockResolvedValue(null)

    await service.handle(payload, signature)

    expect(ledger.creditCharge).not.toHaveBeenCalled()
  })

  it('syncs status from customer.subscription.updated', async () => {
    stripe.constructWebhookEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'stripe-sub-1',
          status: 'past_due',
          cancel_at_period_end: true,
          items: { data: [{ current_period_end: 1_700_000_000 }] }
        }
      }
    })

    await service.handle(payload, signature)

    expect(subscriptions.syncFromStripe).toHaveBeenCalledWith('stripe-sub-1', 'past_due', 1_700_000_000, true)
  })

  it('marks the subscription canceled from customer.subscription.deleted', async () => {
    stripe.constructWebhookEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'stripe-sub-1' } }
    })

    await service.handle(payload, signature)

    expect(subscriptions.markCanceledByStripeId).toHaveBeenCalledWith('stripe-sub-1')
  })

  it('syncs charges/payouts enabled from account.updated', async () => {
    stripe.constructWebhookEvent.mockReturnValue({
      type: 'account.updated',
      data: { object: { id: 'acct_1', charges_enabled: true, payouts_enabled: false } }
    })

    await service.handle(payload, signature)

    expect(payout.syncFromStripe).toHaveBeenCalledWith('acct_1', true, false)
  })

  it('ignores event types it does not handle', async () => {
    stripe.constructWebhookEvent.mockReturnValue({ type: 'payment_intent.succeeded', data: { object: {} } })

    await expect(service.handle(payload, signature)).resolves.toBeUndefined()
  })
})
