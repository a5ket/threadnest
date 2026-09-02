import { Injectable } from '@nestjs/common'
import { NestRepository } from '../nest.repository'
import { NestLedgerEntryRepository } from './nest-ledger-entry.repository'

/**
 * Keeps a nest's withdrawable balance in sync with its ledger — see
 * {@link NestLedgerEntryRepository} for the audit trail itself.
 */
@Injectable()
export class NestLedgerService {
  constructor(
    private readonly ledgerRepo: NestLedgerEntryRepository,
    private readonly nestsRepo: NestRepository
  ) { }

  /**
   * Records the charge and increments the balance — a no-op if `stripeReference` was already
   * recorded, so a redelivered `invoice.paid` webhook can't double-credit the nest.
   *
   * @param nestId - The nest being credited.
   * @param amountCents - The charge amount.
   * @param stripeReference - The Stripe invoice id, used to dedupe redeliveries.
   */
  async creditCharge(nestId: string, amountCents: number, stripeReference: string) {
    const recorded = await this.ledgerRepo.recordCharge(nestId, amountCents, stripeReference)

    if (recorded) {
      await this.nestsRepo.adjustBalanceCents(nestId, amountCents)
    }
  }

  /**
   * Records the withdrawal and decrements the balance — same dedupe guarantee as {@link creditCharge}.
   *
   * @param nestId - The nest being debited.
   * @param amountCents - The withdrawal amount.
   * @param stripeReference - The Stripe transfer id, used to dedupe redeliveries.
   */
  async debitWithdrawal(nestId: string, amountCents: number, stripeReference: string) {
    const recorded = await this.ledgerRepo.recordWithdrawal(nestId, amountCents, stripeReference)

    if (recorded) {
      await this.nestsRepo.adjustBalanceCents(nestId, -amountCents)
    }
  }
}
