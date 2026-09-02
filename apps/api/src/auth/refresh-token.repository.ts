import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

/** Persistence for refresh-token sessions, including the atomic claim used to make rotation single-use. */
@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Creates the initial session row for a new login/registration.
   *
   * @param userId - The session owner.
   * @param tokenHash - SHA-256 hash of the raw refresh token (never stored raw).
   * @param familyId - Groups every token descended from one login, for future family-wide revocation.
   * @param expiresAt - When the session stops being refreshable.
   * @returns The new session's `id`.
   */
  async create(userId: string, tokenHash: string, familyId: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: { userId, tokenHash, familyId, expiresAt },
      select: { id: true }
    })
  }

  /**
   * Looks up a session by its token hash, including the owning user's auth-relevant fields.
   *
   * @param tokenHash - SHA-256 hash of the raw refresh token.
   * @returns The session with its user, or null if the hash doesn't match any session.
   */
  async findByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, emailVerifiedAt: true }
        }
      }
    })
  }

  /**
   * Revokes a single session — used for "log out this device."
   *
   * @param id - The session to revoke.
   * @param userId - Must own `id`, so a session id from one user can't revoke another's session.
   */
  async revokeOne(id: string, userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  }

  /**
   * Revokes every active session for a user — used for "log out everywhere" and password resets.
   *
   * @param userId - The account to sign out everywhere.
   */
  async revokeAll(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  }

  /**
   * Atomically claims the current session (revoking it) and issues its replacement in one
   * transaction, so two concurrent rotation attempts on the same token can't both succeed.
   *
   * @param currentId - The session being rotated.
   * @param userId - Must own `currentId`.
   * @param newTokenHash - SHA-256 hash of the newly issued raw refresh token.
   * @param familyId - Carried over from the current session.
   * @param expiresAt - Expiry for the new session.
   * @returns The new session, or null if another request already claimed `currentId` first — the
   *   caller is expected to fall back to waiting for that request's result instead of erroring.
   */
  async rotate(currentId: string, userId: string, newTokenHash: string, familyId: string, expiresAt: Date) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.refreshToken.updateMany({
        where: { id: currentId, userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })

      if (claimed.count !== 1) {
        return null
      }

      const newSession = await tx.refreshToken.create({
        data: { userId, tokenHash: newTokenHash, familyId, expiresAt },
        select: { id: true }
      })

      await tx.refreshToken.update({
        where: { id: currentId },
        data: { replacedByTokenId: newSession.id }
      })

      return newSession
    })
  }
}
