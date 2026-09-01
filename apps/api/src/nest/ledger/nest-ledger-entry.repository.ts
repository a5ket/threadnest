import { Injectable } from '@nestjs/common'
import { NestLedgerEntryType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

@Injectable()
export class NestLedgerEntryRepository {
  constructor(private readonly prisma: PrismaService) { }

  // Returns false instead of throwing when stripeReference was already recorded, so callers
  // can treat a redelivered webhook as a no-op rather than an error.
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
