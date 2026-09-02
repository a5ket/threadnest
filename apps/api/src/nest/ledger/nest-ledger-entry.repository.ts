import { Injectable } from '@nestjs/common'
import { NestLedgerEntryType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

/** Append-only ledger of a nest's paywall charges and withdrawals — the audit trail behind its balance. */
@Injectable()
export class NestLedgerEntryRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * `stripeReference` has a unique constraint, so a redelivered Stripe webhook can't double-record
   * the same charge.
   *
   * @param nestId - The nest being credited.
   * @param amountCents - The charge amount.
   * @param stripeReference - The Stripe invoice/event id, used to dedupe redeliveries.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns true if a new entry was recorded, false if `stripeReference` was already recorded
   *   (a redelivery) — callers should treat false as a no-op, not an error.
   */
  async recordCharge(nestId: string, amountCents: number, stripeReference: string, db: Database = this.prisma): Promise<boolean> {
    try {
      await db.nestLedgerEntry.create({
        data: { nestId, type: NestLedgerEntryType.CHARGE, amountCents, stripeReference }
      })

      return true
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error, 'stripeReference')) {
        return false
      }

      throw error
    }
  }

  /** Same dedupe behavior as {@link recordCharge}, for the withdrawal side of the ledger. */
  async recordWithdrawal(nestId: string, amountCents: number, stripeReference: string, db: Database = this.prisma): Promise<boolean> {
    try {
      await db.nestLedgerEntry.create({
        data: { nestId, type: NestLedgerEntryType.WITHDRAWAL, amountCents, stripeReference }
      })

      return true
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error, 'stripeReference')) {
        return false
      }

      throw error
    }
  }
}
