import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { USER_AUTH_SELECT } from './selects/user.auth.select'
import { UserNotFoundException } from './exceptions/user-not-found.exception'

/**
 * Persistence for `User` — credentials and email, as opposed to {@link UserProfileRepository}'s
 * public-facing profile fields.
 */
@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  /** @param userId - The account to check. */
  async exists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    return Boolean(user)
  }

  /**
   * @param userId - The account to look up.
   * @throws {Error} (Prisma's `findUniqueOrThrow`) No such user — this method assumes the id is
   *   already known-valid (e.g. from a verified access token).
   */
  async findByIdWithEmail(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true }
    })
  }

  /** @param email - The address to check. */
  async existsByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    return Boolean(user)
  }

  /**
   * @param email - The address to look up.
   * @returns The user with credentials, or null if no account has this email.
   */
  async findByEmailWithCredentials(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_AUTH_SELECT
    })
  }

  /**
   * @param userId - The account to look up.
   * @throws {UserNotFoundException} No such user.
   */
  async getByIdWithCredentials(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true }
    })

    if (!user) {
      throw new UserNotFoundException()
    }

    return user
  }

  /**
   * @param email - The address to look up.
   * @throws {UserNotFoundException} No account has this email.
   */
  async getByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
      }
    })

    if (!user) {
      throw new UserNotFoundException()
    }

    return user
  }

  /**
   * @param userId - The account to update.
   * @param passwordHash - The new hash — already hashed by the caller, never stored raw.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async updatePassword(userId: string, passwordHash: string, db: Database = this.prisma) {
    return db.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true }
    })
  }

  /**
   * @param userId - The account to mark verified.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async markEmailVerified(userId: string, db: Database = this.prisma) {
    return db.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
      select: { id: true }
    })
  }

  /**
   * Changes the email and marks it verified — the caller is expected to have already proven
   * ownership of the new address (e.g. by redeeming a confirmation token sent to it) before
   * calling this, so verification is re-stamped here, not cleared.
   *
   * @param userId - The account to update.
   * @param email - The new (now-confirmed) address.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async updateEmail(userId: string, email: string, db: Database = this.prisma) {
    return db.user.update({
      where: { id: userId },
      data: { email, emailVerifiedAt: new Date() },
      select: { id: true }
    })
  }

  /**
   * @param email - The new account's address (assumed already confirmed unique by the caller).
   * @param passwordHash - Already hashed by the caller, never stored raw.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async create(email: string, passwordHash: string, db: Database = this.prisma) {
    return db.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true }
    })
  }
}