import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { USER_PROFILE_SELECT } from './selects/user-profile.select'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UserQueryDto } from './dto/user.query.dto'
import { UserNotFoundException } from './exceptions/user-not-found.exception'

/**
 * Persistence for `UserProfile` — the public-facing half of a user (username, display name, bio,
 * avatar), as opposed to {@link UserRepository}'s credentials/email.
 */
@Injectable()
export class UserProfileRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param userId - The account to attach a profile to.
   * @param username - Must already be confirmed available.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async create(userId: string, username: string, db: Database = this.prisma) {
    return db.userProfile.create({
      data: { userId, username },
      select: USER_PROFILE_SELECT
    })
  }

  /**
   * @param username - The username to check.
   * @param excludeUserId - Pass the current user's id when checking their own unchanged
   *   username, so it isn't reported as taken by itself.
   * @returns true if another account already holds this username.
   */
  async isUsernameTaken(username: string, excludeUserId?: string) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { username },
      select: { userId: true }
    })

    if (!existing) return false
    if (excludeUserId && existing.userId === excludeUserId) return false

    return true
  }

  /**
   * @param userId - The account to look up.
   * @throws {UserNotFoundException} No such user.
   */
  async getByUserId(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { userId: true, ...USER_PROFILE_SELECT }
    })

    if (!profile) {
      throw new UserNotFoundException()
    }

    return profile
  }

  /**
   * @param username - The username to look up.
   * @throws {UserNotFoundException} No profile with this username.
   */
  async getByUsername(username: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { username },
      select: { userId: true, ...USER_PROFILE_SELECT }
    })

    if (!profile) {
      throw new UserNotFoundException()
    }

    return profile
  }

  /**
   * @param userId - The account to update.
   * @param dto - Fields to change; omitted fields are left as-is.
   */
  async update(userId: string, dto: UpdateProfileDto) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: dto,
      select: { userId: true, ...USER_PROFILE_SELECT }
    })
  }

  /**
   * @param userId - The account to update.
   * @param avatarKey - The new storage key, or null to clear the avatar.
   */
  async updateAvatarKey(userId: string, avatarKey: string | null) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: { avatarKey },
      select: { userId: true, ...USER_PROFILE_SELECT }
    })
  }

  /**
   * Cursor-paginated username/display-name search (case-insensitive substring match), ordered newest-first.
   *
   * @param query - Search term plus `limit`/`cursor` pagination.
   * @returns A page of matching profiles and pagination metadata.
   * @throws {InvalidCursorException} `query.cursor` is malformed.
   */
  async search(query: UserQueryDto) {
    const { limit, cursor, search } = query
    let cursorWhere = {}

    if (cursor) {
      try {
        const { date, id } = decodeCursor(cursor)
        cursorWhere = { OR: [{ createdAt: { lt: date } }, { createdAt: date, userId: { lt: id } }] }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const profiles = await this.prisma.userProfile.findMany({
      where: {
        ...(search
          ? { OR: [{ username: { contains: search, mode: 'insensitive' as const } }, { displayName: { contains: search, mode: 'insensitive' as const } }] }
          : {}),
        ...cursorWhere
      },
      select: { userId: true, username: true, displayName: true, avatarKey: true, createdAt: true },
      orderBy: [{ createdAt: 'desc' }, { userId: 'desc' }],
      take: limit + 1
    })

    const hasMore = profiles.length > limit
    const items = (hasMore ? profiles.slice(0, limit) : profiles).map((p) => ({
      id: p.userId,
      username: p.username,
      displayName: p.displayName,
      avatarKey: p.avatarKey,
    }))
    const last = (hasMore ? profiles.slice(0, limit) : profiles).at(-1)

    const nextCursor = last && hasMore ? encodeCursor(last.createdAt, last.userId) : null

    return { items, meta: { nextCursor, hasMore } }
  }

  /**
   * Profile joined with the owning user's account fields, for callers that need both in one
   * query rather than fetching the profile and account separately.
   *
   * @param userId - The account to look up.
   * @throws {UserNotFoundException} No such user.
   */
  async getWithUser(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        username: true,
        avatarKey: true,
        user: {
          select: {
            id: true,
            email: true,
            emailVerifiedAt: true
          }
        }
      }
    })

    if (!profile) {
      throw new UserNotFoundException()
    }

    return profile
  }
}
