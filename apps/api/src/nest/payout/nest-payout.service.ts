import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { StripeService } from 'src/billing/stripe.service'
import { UrlBuilder } from 'src/url/url.builder'
import { NestLedgerService } from '../ledger/nest-ledger.service'
import { NestRepository } from '../nest.repository'
import { NothingToWithdrawException } from './exceptions/nothing-to-withdraw.exception'
import { PayoutAccountNotConnectedException } from './exceptions/payout-account-not-connected.exception'
import { PayoutsNotEnabledException } from './exceptions/payouts-not-enabled.exception'
import { NestPayoutAccountRepository } from './nest-payout-account.repository'
import { NestPayoutPolicy } from './nest-payout.policy'

export interface NestPayoutAccountView {
  isConnected: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  balanceCents: number
}

@Injectable()
export class NestPayoutService {
  constructor(
    private readonly payoutPolicy: NestPayoutPolicy,
    private readonly payoutAccountRepo: NestPayoutAccountRepository,
    private readonly nestsRepo: NestRepository,
    private readonly ledger: NestLedgerService,
    private readonly stripe: StripeService,
    private readonly urls: UrlBuilder,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(NestPayoutService.name)
  }

  async get(nestSlug: string, actorUserId: string): Promise<NestPayoutAccountView> {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.payoutPolicy.assertCanManage(nest.id, actorUserId)

    const [account, balanceCents] = await Promise.all([
      this.payoutAccountRepo.get(nest.id),
      this.nestsRepo.getBalanceCents(nest.id)
    ])

    return this.toView(account, balanceCents)
  }

  async startOnboarding(nestSlug: string, actorUserId: string, actorEmail: string): Promise<{ url: string }> {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.payoutPolicy.assertCanManage(nest.id, actorUserId)

    let account = await this.payoutAccountRepo.get(nest.id)

    if (!account) {
      const stripeAccountId = await this.stripe.createConnectedAccount(actorEmail)
      account = await this.payoutAccountRepo.create(nest.id, stripeAccountId)

      this.logger.info({ nestId: nest.id, actorUserId, stripeAccountId }, 'Nest payout account connected')
    }

    const url = await this.stripe.createAccountLink({
      accountId: account.stripeAccountId,
      refreshUrl: this.urls.nestPayoutOnboardingRefresh(nestSlug),
      returnUrl: this.urls.nestPayoutOnboardingReturn(nestSlug)
    })

    return { url }
  }

  async syncFromStripe(stripeAccountId: string, chargesEnabled: boolean, payoutsEnabled: boolean) {
    await this.payoutAccountRepo.updateByStripeAccountId(stripeAccountId, { chargesEnabled, payoutsEnabled })
  }

  async withdraw(nestSlug: string, actorUserId: string): Promise<NestPayoutAccountView> {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.payoutPolicy.assertCanManage(nest.id, actorUserId)

    const account = await this.payoutAccountRepo.get(nest.id)

    if (!account) {
      throw new PayoutAccountNotConnectedException()
    }

    if (!account.payoutsEnabled) {
      throw new PayoutsNotEnabledException()
    }

    const balanceCents = await this.nestsRepo.getBalanceCents(nest.id)

    if (balanceCents <= 0) {
      throw new NothingToWithdrawException()
    }

    const stripeReference = await this.stripe.createTransfer(account.stripeAccountId, balanceCents)
    await this.ledger.debitWithdrawal(nest.id, balanceCents, stripeReference)

    this.logger.info({ nestId: nest.id, actorUserId, amountCents: balanceCents, stripeReference }, 'Nest balance withdrawn')

    return this.toView(account, 0)
  }

  private toView(account: { chargesEnabled: boolean, payoutsEnabled: boolean } | null, balanceCents: number): NestPayoutAccountView {
    return {
      isConnected: account !== null,
      chargesEnabled: account?.chargesEnabled ?? false,
      payoutsEnabled: account?.payoutsEnabled ?? false,
      balanceCents
    }
  }
}
