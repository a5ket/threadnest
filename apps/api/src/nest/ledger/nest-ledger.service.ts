import { Injectable } from '@nestjs/common'
import { NestRepository } from '../nest.repository'
import { NestLedgerEntryRepository } from './nest-ledger-entry.repository'

@Injectable()
export class NestLedgerService {
  constructor(
    private readonly ledgerRepo: NestLedgerEntryRepository,
    private readonly nestsRepo: NestRepository
  ) { }

  async creditCharge(nestId: string, amountCents: number, stripeReference: string) {
    const recorded = await this.ledgerRepo.recordCharge(nestId, amountCents, stripeReference)

    if (recorded) {
      await this.nestsRepo.adjustBalanceCents(nestId, amountCents)
    }
  }

  async debitWithdrawal(nestId: string, amountCents: number, stripeReference: string) {
    const recorded = await this.ledgerRepo.recordWithdrawal(nestId, amountCents, stripeReference)

    if (recorded) {
      await this.nestsRepo.adjustBalanceCents(nestId, -amountCents)
    }
  }
}
