import { Injectable } from '@nestjs/common'
import { ConfirmationTokenType, ConfirmationTokenStatus } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

/** Persistence for single-use email-verification / password-reset / email-change tokens. */
@Injectable()
export class ConfirmationTokenRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Creates a token row.
   *
   * @param userId - The account the token is for.
   * @param tokenHash - SHA-256 hash of the raw token (never stored raw).
   * @param type - What the token confirms.
   * @param expiresAt - When the token stops being redeemable.
   * @param targetEmail - The pending new address — only set for `EMAIL_CHANGE` tokens.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The new token's `id`.
   */
  async create(userId: string, tokenHash: string, type: ConfirmationTokenType, expiresAt: Date, targetEmail?: string, db: Database = this.prisma) {
    return db.confirmationToken.create({
      data: { userId, tokenHash, type, expiresAt, targetEmail },
      select: { id: true }
    })
  }

  /**
   * Looks up a token by its hash, including the owning user's id/email.
   *
   * @param tokenHash - SHA-256 hash of the raw token.
   * @returns The token with its user, or null if the hash doesn't match any token.
   */
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

  /**
   * Marks a token as consumed so it can't be redeemed a second time.
   *
   * @param id - The token to redeem.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async redeem(id: string, db: Database = this.prisma) {
    return db.confirmationToken.update({
      where: { id },
      data: { status: ConfirmationTokenStatus.REDEEMED, usedAt: new Date(), resolvedAt: new Date() }
    })
  }

  /**
   * Invalidates any still-pending token of this type for the user, so requesting a new one
   * retires the old one instead of leaving both valid.
   *
   * @param userId - The account whose pending tokens to supersede.
   * @param type - Only tokens of this type are affected.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async supersedePendingForUser(userId: string, type: ConfirmationTokenType, db: Database = this.prisma) {
    return db.confirmationToken.updateMany({
      where: { userId, type, status: ConfirmationTokenStatus.PENDING },
      data: { status: ConfirmationTokenStatus.SUPERSEDED, resolvedAt: new Date() }
    })
  }
}
