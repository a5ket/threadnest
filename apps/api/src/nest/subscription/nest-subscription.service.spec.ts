import { AlreadySubscribedException } from './exceptions/already-subscribed.exception'
import { NestNotPaywalledException } from './exceptions/nest-not-paywalled.exception'
import { NoActiveSubscriptionException } from './exceptions/no-active-subscription.exception'
import { NestSubscriptionService } from './nest-subscription.service'

describe('NestSubscriptionService', () => {
  const subscriptionsRepo = {
    listActiveByNest: jest.fn(),
    markCanceled: jest.fn(),
    existsActiveForUser: jest.fn(),
    findActiveByUser: jest.fn(),
    create: jest.fn(),
    findByStripeSubscriptionId: jest.fn(),
    updateFromStripe: jest.fn(),
    markCanceledByStripeId: jest.fn()
  }
  const paywallRepo = { get: jest.fn() }
  const nestsRepo = { getBySlug: jest.fn() }
  const stripe = {
    cancelSubscription: jest.fn(),
    createCheckoutSession: jest.fn(),
    retrieveSubscription: jest.fn()
  }
  const urls = { nestCheckoutReturn: jest.fn() }
  const logger = { setContext: jest.fn(), error: jest.fn(), info: jest.fn() }

  const service = new NestSubscriptionService(
    subscriptionsRepo as any,
    paywallRepo as any,
    nestsRepo as any,
    stripe as any,
    urls as any,
    logger as any
  )

  beforeEach(() => {
    jest.clearAllMocks()
    nestsRepo.getBySlug.mockResolvedValue({ id: 'nest-1', name: 'Nest', slug: 'nest-slug' })
  })

  describe('createCheckoutSession', () => {
    it('creates a checkout session when the nest is paywalled and the user is not subscribed', async () => {
      paywallRepo.get.mockResolvedValue({ isPaywalled: true, stripePriceId: 'price-1', priceAmountCents: 500 })
      subscriptionsRepo.existsActiveForUser.mockResolvedValue(false)
      urls.nestCheckoutReturn.mockReturnValue('https://example.com/n/nest-slug?checkout=complete')
      stripe.createCheckoutSession.mockResolvedValue('secret_123')

      const result = await service.createCheckoutSession('nest-slug', 'user-1', 'user@example.com')

      expect(stripe.createCheckoutSession).toHaveBeenCalledWith({
        priceId: 'price-1',
        customerEmail: 'user@example.com',
        returnUrl: 'https://example.com/n/nest-slug?checkout=complete',
        metadata: { nestId: 'nest-1', userId: 'user-1' }
      })
      expect(result).toEqual({ clientSecret: 'secret_123' })
    })

    it('throws NestNotPaywalledException when the nest has no paywall configured', async () => {
      paywallRepo.get.mockResolvedValue(null)

      await expect(
        service.createCheckoutSession('nest-slug', 'user-1', 'user@example.com'),
      ).rejects.toThrow(NestNotPaywalledException)
    })

    it('throws AlreadySubscribedException when the user already has an active subscription', async () => {
      paywallRepo.get.mockResolvedValue({ isPaywalled: true, stripePriceId: 'price-1', priceAmountCents: 500 })
      subscriptionsRepo.existsActiveForUser.mockResolvedValue(true)

      await expect(
        service.createCheckoutSession('nest-slug', 'user-1', 'user@example.com'),
      ).rejects.toThrow(AlreadySubscribedException)
    })
  })

  describe('createFromCheckoutCompleted', () => {
    it('retrieves the Stripe subscription and stores it locally', async () => {
      stripe.retrieveSubscription.mockResolvedValue({
        status: 'active',
        cancel_at_period_end: false,
        items: { data: [{ current_period_end: 1_700_000_000 }] }
      })

      await service.createFromCheckoutCompleted('nest-1', 'user-1', 'stripe-sub-1', 'stripe-cus-1')

      expect(subscriptionsRepo.create).toHaveBeenCalledWith({
        nestId: 'nest-1',
        userId: 'user-1',
        stripeSubscriptionId: 'stripe-sub-1',
        stripeCustomerId: 'stripe-cus-1',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(1_700_000_000 * 1000),
        cancelAtPeriodEnd: false
      })
    })
  })

  describe('syncFromStripe', () => {
    it('updates status, period end, and cancelAtPeriodEnd from a Stripe subscription', async () => {
      await service.syncFromStripe('stripe-sub-1', 'past_due', 1_700_000_000, true)

      expect(subscriptionsRepo.updateFromStripe).toHaveBeenCalledWith('stripe-sub-1', {
        status: 'PAST_DUE',
        currentPeriodEnd: new Date(1_700_000_000 * 1000),
        cancelAtPeriodEnd: true
      })
    })
  })

  describe('markCanceledByStripeId', () => {
    it('delegates to the repository', async () => {
      await service.markCanceledByStripeId('stripe-sub-1')

      expect(subscriptionsRepo.markCanceledByStripeId).toHaveBeenCalledWith('stripe-sub-1')
    })
  })

  describe('findNestIdByStripeSubscriptionId', () => {
    it('returns the nestId when found', async () => {
      subscriptionsRepo.findByStripeSubscriptionId.mockResolvedValue({ id: 'sub-1', nestId: 'nest-1' })

      await expect(service.findNestIdByStripeSubscriptionId('stripe-sub-1')).resolves.toBe('nest-1')
    })

    it('returns null when not found', async () => {
      subscriptionsRepo.findByStripeSubscriptionId.mockResolvedValue(null)

      await expect(service.findNestIdByStripeSubscriptionId('stripe-sub-1')).resolves.toBeNull()
    })
  })

  describe('getForActor', () => {
    it('returns the subscription view when the user has an active subscription', async () => {
      subscriptionsRepo.findActiveByUser.mockResolvedValue({
        id: 'sub-1',
        stripeSubscriptionId: 'stripe-sub-1',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(1_700_000_000_000),
        cancelAtPeriodEnd: false
      })
      paywallRepo.get.mockResolvedValue({ isPaywalled: true, priceAmountCents: 500 })

      await expect(service.getForActor('nest-slug', 'user-1')).resolves.toEqual({
        status: 'ACTIVE',
        currentPeriodEnd: new Date(1_700_000_000_000),
        cancelAtPeriodEnd: false,
        priceAmountCents: 500
      })
    })

    it('returns null when the user has no active subscription', async () => {
      subscriptionsRepo.findActiveByUser.mockResolvedValue(null)

      await expect(service.getForActor('nest-slug', 'user-1')).resolves.toBeNull()
    })
  })

  describe('cancel', () => {
    it('cancels the subscription in Stripe and marks it canceled locally', async () => {
      subscriptionsRepo.findActiveByUser.mockResolvedValue({
        id: 'sub-1',
        stripeSubscriptionId: 'stripe-sub-1',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(1_700_000_000_000),
        cancelAtPeriodEnd: false
      })
      stripe.cancelSubscription.mockResolvedValue(undefined)
      subscriptionsRepo.markCanceled.mockResolvedValue({
        status: 'CANCELED',
        currentPeriodEnd: new Date(1_700_000_000_000),
        cancelAtPeriodEnd: false
      })
      paywallRepo.get.mockResolvedValue({ isPaywalled: true, priceAmountCents: 500 })

      const result = await service.cancel('nest-slug', 'user-1')

      expect(stripe.cancelSubscription).toHaveBeenCalledWith('stripe-sub-1')
      expect(subscriptionsRepo.markCanceled).toHaveBeenCalledWith('sub-1')
      expect(result).toEqual({
        status: 'CANCELED',
        currentPeriodEnd: new Date(1_700_000_000_000),
        cancelAtPeriodEnd: false,
        priceAmountCents: 500
      })
    })

    it('throws NoActiveSubscriptionException when the user has no active subscription', async () => {
      subscriptionsRepo.findActiveByUser.mockResolvedValue(null)

      await expect(service.cancel('nest-slug', 'user-1')).rejects.toThrow(NoActiveSubscriptionException)
      expect(stripe.cancelSubscription).not.toHaveBeenCalled()
    })
  })

  describe('cancelAllForNest', () => {
    it('cancels every active subscription in Stripe and marks it canceled locally', async () => {
      subscriptionsRepo.listActiveByNest.mockResolvedValue([
        { id: 'sub-1', stripeSubscriptionId: 'stripe-sub-1' },
        { id: 'sub-2', stripeSubscriptionId: 'stripe-sub-2' }
      ])
      stripe.cancelSubscription.mockResolvedValue(undefined)
      subscriptionsRepo.markCanceled.mockResolvedValue(undefined)

      await service.cancelAllForNest('nest-1')

      expect(stripe.cancelSubscription).toHaveBeenCalledWith('stripe-sub-1')
      expect(stripe.cancelSubscription).toHaveBeenCalledWith('stripe-sub-2')
      expect(subscriptionsRepo.markCanceled).toHaveBeenCalledWith('sub-1')
      expect(subscriptionsRepo.markCanceled).toHaveBeenCalledWith('sub-2')
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('logs a failure for one subscription without blocking the rest', async () => {
      subscriptionsRepo.listActiveByNest.mockResolvedValue([
        { id: 'sub-1', stripeSubscriptionId: 'stripe-sub-1' },
        { id: 'sub-2', stripeSubscriptionId: 'stripe-sub-2' }
      ])
      stripe.cancelSubscription.mockImplementation((id: string) => (
        id === 'stripe-sub-1' ? Promise.reject(new Error('stripe error')) : Promise.resolve(undefined)
      ))
      subscriptionsRepo.markCanceled.mockResolvedValue(undefined)

      await service.cancelAllForNest('nest-1')

      expect(subscriptionsRepo.markCanceled).toHaveBeenCalledWith('sub-2')
      expect(subscriptionsRepo.markCanceled).not.toHaveBeenCalledWith('sub-1')
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ nestId: 'nest-1', subscriptionId: 'sub-1' }),
        'Failed to cancel nest subscription'
      )
    })
  })
})
