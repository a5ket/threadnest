import { Injectable } from '@nestjs/common'
import { ConfirmationTokenType, ConfirmationTokenStatus } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

@Injectable()
export class ConfirmationTokenRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, tokenHash: string, type: ConfirmationTokenType, expiresAt: Date, targetEmail?: string, db: Database = this.prisma) {
    return db.confirmationToken.create({
      data: { userId, tokenHash, type, expiresAt, targetEmail },
      select: { id: true }
    })
  }

  async findByHash(tokenHash: string) {
    return this.prisma.confirmationToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    })
  }

  async redeem(id: string, db: Database = this.prisma) {
    return db.confirmationToken.update({
      where: { id },
      data: { status: ConfirmationTokenStatus.REDEEMED, usedAt: new Date(), resolvedAt: new Date() }
    })
  }

  async supersedePendingForUser(userId: string, type: ConfirmationTokenType, db: Database = this.prisma) {
    return db.confirmationToken.updateMany({
      where: { userId, type, status: ConfirmationTokenStatus.PENDING },
      data: { status: ConfirmationTokenStatus.SUPERSEDED, resolvedAt: new Date() }
    })
  }
}
