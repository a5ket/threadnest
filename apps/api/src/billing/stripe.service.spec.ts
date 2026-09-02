import Stripe from 'stripe'
import { StripeService } from './stripe.service'

const mockStripeClient = {
  subscriptions: { cancel: jest.fn(), retrieve: jest.fn() },
  prices: { create: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  accounts: { create: jest.fn(), retrieve: jest.fn() },
  accountLinks: { create: jest.fn() },
  transfers: { create: jest.fn() },
  webhooks: { constructEvent: jest.fn() },
}

jest.mock('stripe', () => jest.fn().mockImplementation(() => mockStripeClient))

describe('StripeService', () => {
  const config = {
    getOrThrow: jest.fn((key: string) => (key === 'stripeSecretKey' ? 'sk_test_123' : 'whsec_test_123')),
  }

  const service = new StripeService(config as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('constructs the Stripe client with the configured secret key', () => {
    new StripeService(config as any)

    expect(Stripe).toHaveBeenCalledWith('sk_test_123')
  })

  describe('cancelSubscription', () => {
    it('cancels the subscription by id', async () => {
      mockStripeClient.subscriptions.cancel.mockResolvedValue({} as any)

      await service.cancelSubscription('sub_1')

      expect(mockStripeClient.subscriptions.cancel).toHaveBeenCalledWith('sub_1')
    })
  })

  describe('createPrice', () => {
    it('creates a monthly recurring USD price and returns its id', async () => {
      mockStripeClient.prices.create.mockResolvedValue({ id: 'price_1' } as any)

      const result = await service.createPrice('Nest membership', 500)

      expect(mockStripeClient.prices.create).toHaveBeenCalledWith({
        currency: 'usd',
        unit_amount: 500,
        recurring: { interval: 'month' },
        product_data: { name: 'Nest membership' },
      })
      expect(result).toBe('price_1')
    })
  })

  describe('createCheckoutSession', () => {
    it('creates an embedded subscription checkout session and returns its client secret', async () => {
      mockStripeClient.checkout.sessions.create.mockResolvedValue({ client_secret: 'secret_1' } as any)

      const result = await service.createCheckoutSession({
        priceId: 'price_1',
        customerEmail: 'a@b.com',
        returnUrl: 'https://app.test/return',
        metadata: { nestId: 'nest-1' },
      })

      expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'subscription',
        ui_mode: 'embedded_page',
        line_items: [{ price: 'price_1', quantity: 1 }],
        customer_email: 'a@b.com',
        return_url: 'https://app.test/return',
        metadata: { nestId: 'nest-1' },
      })
      expect(result).toBe('secret_1')
    })
  })

  describe('retrieveSubscription', () => {
    it('delegates directly to the Stripe client', async () => {
      const subscription = { id: 'sub_1' }
      mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription as any)

      const result = await service.retrieveSubscription('sub_1')

      expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledWith('sub_1')
      expect(result).toBe(subscription)
    })
  })

  describe('createConnectedAccount', () => {
    it('creates an express account with transfers capability and returns its id', async () => {
      mockStripeClient.accounts.create.mockResolvedValue({ id: 'acct_1' } as any)

      const result = await service.createConnectedAccount('seller@b.com')

      expect(mockStripeClient.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        email: 'seller@b.com',
        capabilities: { transfers: { requested: true } },
      })
      expect(result).toBe('acct_1')
    })
  })

  describe('createAccountLink', () => {
    it('creates an onboarding account link and returns its url', async () => {
      mockStripeClient.accountLinks.create.mockResolvedValue({ url: 'https://connect.stripe.com/onboard' } as any)

      const result = await service.createAccountLink({
        accountId: 'acct_1',
        refreshUrl: 'https://app.test/refresh',
        returnUrl: 'https://app.test/return',
      })

      expect(mockStripeClient.accountLinks.create).toHaveBeenCalledWith({
        account: 'acct_1',
        refresh_url: 'https://app.test/refresh',
        return_url: 'https://app.test/return',
        type: 'account_onboarding',
      })
      expect(result).toBe('https://connect.stripe.com/onboard')
    })
  })

  describe('retrieveAccount', () => {
    it('delegates directly to the Stripe client', async () => {
      const account = { id: 'acct_1' }
      mockStripeClient.accounts.retrieve.mockResolvedValue(account as any)

      const result = await service.retrieveAccount('acct_1')

      expect(mockStripeClient.accounts.retrieve).toHaveBeenCalledWith('acct_1')
      expect(result).toBe(account)
    })
  })

  describe('createTransfer', () => {
    it('transfers to the destination account and returns the transfer id', async () => {
      mockStripeClient.transfers.create.mockResolvedValue({ id: 'tr_1' } as any)

      const result = await service.createTransfer('acct_1', 1000)

      expect(mockStripeClient.transfers.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
        destination: 'acct_1',
      })
      expect(result).toBe('tr_1')
    })
  })

  describe('constructWebhookEvent', () => {
    it('verifies the payload against the configured webhook secret', () => {
      const event = { id: 'evt_1' }
      mockStripeClient.webhooks.constructEvent.mockReturnValue(event as any)

      const payload = Buffer.from('payload')
      const result = service.constructWebhookEvent(payload, 'sig_1')

      expect(mockStripeClient.webhooks.constructEvent).toHaveBeenCalledWith(payload, 'sig_1', 'whsec_test_123')
      expect(result).toBe(event)
    })

    it('propagates the signature verification error', () => {
      mockStripeClient.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('invalid signature')
      })

      expect(() => service.constructWebhookEvent(Buffer.from('payload'), 'bad-sig')).toThrow('invalid signature')
    })
  })
})
