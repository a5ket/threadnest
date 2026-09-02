import { NestPaywallService } from './nest-paywall.service'

describe('NestPaywallService', () => {
  const paywallPolicy = { assertCanManage: jest.fn() }
  const paywallRepo = { get: jest.fn(), upsert: jest.fn() }
  const nestsRepo = { getBySlug: jest.fn() }
  const stripe = { createPrice: jest.fn() }
  const logger = { setContext: jest.fn(), info: jest.fn() }

  const service = new NestPaywallService(paywallPolicy as any, paywallRepo as any, nestsRepo as any, stripe as any, logger as any)

  beforeEach(() => {
    jest.clearAllMocks()
    nestsRepo.getBySlug.mockResolvedValue({ id: 'nest-1', name: 'Nest' })
  })

  describe('get', () => {
    it('returns a default view when the nest has never enabled a paywall', async () => {
      paywallRepo.get.mockResolvedValue(null)

      const result = await service.get('nest-slug', 'user-1')

      expect(paywallPolicy.assertCanManage).toHaveBeenCalledWith('nest-1', 'user-1')
      expect(result).toEqual({ isPaywalled: false, priceAmountCents: null })
    })

    it('returns the stored configuration', async () => {
      paywallRepo.get.mockResolvedValue({ isPaywalled: true, stripePriceId: 'price-1', priceAmountCents: 500 })

      const result = await service.get('nest-slug', 'user-1')

      expect(result).toEqual({ isPaywalled: true, priceAmountCents: 500 })
    })

    it('propagates the policy failure without reading the paywall config', async () => {
      paywallPolicy.assertCanManage.mockRejectedValueOnce(new Error('cannot manage'))

      await expect(service.get('nest-slug', 'user-1')).rejects.toThrow('cannot manage')

      expect(paywallRepo.get).not.toHaveBeenCalled()
    })
  })

  describe('setPrice', () => {
    it('creates a Stripe price and enables the paywall', async () => {
      stripe.createPrice.mockResolvedValue('price-1')
      paywallRepo.upsert.mockResolvedValue({ isPaywalled: true, stripePriceId: 'price-1', priceAmountCents: 500 })

      const result = await service.setPrice('nest-slug', 'user-1', { amountCents: 500 })

      expect(paywallPolicy.assertCanManage).toHaveBeenCalledWith('nest-1', 'user-1')
      expect(stripe.createPrice).toHaveBeenCalledWith('Nest', 500)
      expect(paywallRepo.upsert).toHaveBeenCalledWith('nest-1', {
        isPaywalled: true,
        stripePriceId: 'price-1',
        priceAmountCents: 500
      })
      expect(result).toEqual({ isPaywalled: true, priceAmountCents: 500 })
    })

    it('propagates the policy failure without creating a Stripe price', async () => {
      paywallPolicy.assertCanManage.mockRejectedValueOnce(new Error('cannot manage'))

      await expect(service.setPrice('nest-slug', 'user-1', { amountCents: 500 })).rejects.toThrow('cannot manage')

      expect(stripe.createPrice).not.toHaveBeenCalled()
    })
  })

  describe('disable', () => {
    it('turns the paywall off without touching Stripe', async () => {
      paywallRepo.upsert.mockResolvedValue({ isPaywalled: false, stripePriceId: 'price-1', priceAmountCents: 500 })

      const result = await service.disable('nest-slug', 'user-1')

      expect(paywallPolicy.assertCanManage).toHaveBeenCalledWith('nest-1', 'user-1')
      expect(stripe.createPrice).not.toHaveBeenCalled()
      expect(paywallRepo.upsert).toHaveBeenCalledWith('nest-1', { isPaywalled: false })
      expect(result).toEqual({ isPaywalled: false, priceAmountCents: 500 })
    })

    it('propagates the policy failure without touching the paywall config', async () => {
      paywallPolicy.assertCanManage.mockRejectedValueOnce(new Error('cannot manage'))

      await expect(service.disable('nest-slug', 'user-1')).rejects.toThrow('cannot manage')

      expect(paywallRepo.upsert).not.toHaveBeenCalled()
    })
  })
})
