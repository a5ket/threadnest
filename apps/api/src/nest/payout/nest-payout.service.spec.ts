import { NothingToWithdrawException } from './exceptions/nothing-to-withdraw.exception'
import { PayoutAccountNotConnectedException } from './exceptions/payout-account-not-connected.exception'
import { PayoutsNotEnabledException } from './exceptions/payouts-not-enabled.exception'
import { NestPayoutService } from './nest-payout.service'

describe('NestPayoutService', () => {
  const payoutPolicy = { assertCanManage: jest.fn() }
  const payoutAccountRepo = { get: jest.fn(), create: jest.fn(), updateByStripeAccountId: jest.fn() }
  const nestsRepo = { getBySlug: jest.fn(), getBalanceCents: jest.fn() }
  const ledger = { debitWithdrawal: jest.fn() }
  const stripe = { createConnectedAccount: jest.fn(), createAccountLink: jest.fn(), createTransfer: jest.fn() }
  const urls = { nestPayoutOnboardingReturn: jest.fn(), nestPayoutOnboardingRefresh: jest.fn() }
  const logger = { setContext: jest.fn(), info: jest.fn() }

  const service = new NestPayoutService(
    payoutPolicy as any,
    payoutAccountRepo as any,
    nestsRepo as any,
    ledger as any,
    stripe as any,
    urls as any,
    logger as any
  )

  beforeEach(() => {
    jest.clearAllMocks()
    nestsRepo.getBySlug.mockResolvedValue({ id: 'nest-1', name: 'Nest' })
  })

  describe('get', () => {
    it('returns a disconnected view when no payout account exists', async () => {
      payoutAccountRepo.get.mockResolvedValue(null)
      nestsRepo.getBalanceCents.mockResolvedValue(0)

      const result = await service.get('nest-slug', 'user-1')

      expect(payoutPolicy.assertCanManage).toHaveBeenCalledWith('nest-1', 'user-1')
      expect(result).toEqual({ isConnected: false, chargesEnabled: false, payoutsEnabled: false, balanceCents: 0 })
    })

    it('returns the connected account status and balance', async () => {
      payoutAccountRepo.get.mockResolvedValue({ stripeAccountId: 'acct_1', chargesEnabled: true, payoutsEnabled: true })
      nestsRepo.getBalanceCents.mockResolvedValue(1500)

      const result = await service.get('nest-slug', 'user-1')

      expect(result).toEqual({ isConnected: true, chargesEnabled: true, payoutsEnabled: true, balanceCents: 1500 })
    })
  })

  describe('startOnboarding', () => {
    it('creates a connected account and an onboarding link when none exists yet', async () => {
      payoutAccountRepo.get.mockResolvedValue(null)
      stripe.createConnectedAccount.mockResolvedValue('acct_1')
      payoutAccountRepo.create.mockResolvedValue({ stripeAccountId: 'acct_1', chargesEnabled: false, payoutsEnabled: false })
      urls.nestPayoutOnboardingRefresh.mockReturnValue('https://example.com/n/nest-slug/settings?payout=refresh')
      urls.nestPayoutOnboardingReturn.mockReturnValue('https://example.com/n/nest-slug/settings?payout=onboarded')
      stripe.createAccountLink.mockResolvedValue('https://connect.stripe.com/setup/1')

      const result = await service.startOnboarding('nest-slug', 'user-1', 'user@example.com')

      expect(payoutPolicy.assertCanManage).toHaveBeenCalledWith('nest-1', 'user-1')
      expect(stripe.createConnectedAccount).toHaveBeenCalledWith('user@example.com')
      expect(payoutAccountRepo.create).toHaveBeenCalledWith('nest-1', 'acct_1')
      expect(stripe.createAccountLink).toHaveBeenCalledWith({
        accountId: 'acct_1',
        refreshUrl: 'https://example.com/n/nest-slug/settings?payout=refresh',
        returnUrl: 'https://example.com/n/nest-slug/settings?payout=onboarded'
      })
      expect(result).toEqual({ url: 'https://connect.stripe.com/setup/1' })
    })

    it('reuses the existing connected account without creating a new one', async () => {
      payoutAccountRepo.get.mockResolvedValue({ stripeAccountId: 'acct_1', chargesEnabled: true, payoutsEnabled: false })
      stripe.createAccountLink.mockResolvedValue('https://connect.stripe.com/setup/1')

      await service.startOnboarding('nest-slug', 'user-1', 'user@example.com')

      expect(stripe.createConnectedAccount).not.toHaveBeenCalled()
      expect(payoutAccountRepo.create).not.toHaveBeenCalled()
      expect(stripe.createAccountLink).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'acct_1' }))
    })
  })

  describe('syncFromStripe', () => {
    it('delegates to the repository', async () => {
      await service.syncFromStripe('acct_1', true, false)

      expect(payoutAccountRepo.updateByStripeAccountId).toHaveBeenCalledWith('acct_1', { chargesEnabled: true, payoutsEnabled: false })
    })
  })

  describe('withdraw', () => {
    it('transfers the full balance and debits the ledger', async () => {
      payoutAccountRepo.get.mockResolvedValue({ stripeAccountId: 'acct_1', chargesEnabled: true, payoutsEnabled: true })
      nestsRepo.getBalanceCents.mockResolvedValue(2500)
      stripe.createTransfer.mockResolvedValue('tr_1')

      const result = await service.withdraw('nest-slug', 'user-1')

      expect(payoutPolicy.assertCanManage).toHaveBeenCalledWith('nest-1', 'user-1')
      expect(stripe.createTransfer).toHaveBeenCalledWith('acct_1', 2500)
      expect(ledger.debitWithdrawal).toHaveBeenCalledWith('nest-1', 2500, 'tr_1')
      expect(result).toEqual({ isConnected: true, chargesEnabled: true, payoutsEnabled: true, balanceCents: 0 })
    })

    it('throws PayoutAccountNotConnectedException when there is no connected account', async () => {
      payoutAccountRepo.get.mockResolvedValue(null)

      await expect(service.withdraw('nest-slug', 'user-1')).rejects.toThrow(PayoutAccountNotConnectedException)
      expect(stripe.createTransfer).not.toHaveBeenCalled()
    })

    it('throws PayoutsNotEnabledException when the connected account cannot yet receive payouts', async () => {
      payoutAccountRepo.get.mockResolvedValue({ stripeAccountId: 'acct_1', chargesEnabled: true, payoutsEnabled: false })

      await expect(service.withdraw('nest-slug', 'user-1')).rejects.toThrow(PayoutsNotEnabledException)
      expect(stripe.createTransfer).not.toHaveBeenCalled()
    })

    it('throws NothingToWithdrawException when the balance is zero', async () => {
      payoutAccountRepo.get.mockResolvedValue({ stripeAccountId: 'acct_1', chargesEnabled: true, payoutsEnabled: true })
      nestsRepo.getBalanceCents.mockResolvedValue(0)

      await expect(service.withdraw('nest-slug', 'user-1')).rejects.toThrow(NothingToWithdrawException)
      expect(stripe.createTransfer).not.toHaveBeenCalled()
    })
  })
})
