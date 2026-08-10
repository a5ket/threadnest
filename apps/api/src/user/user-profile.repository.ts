import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { USER_PROFILE_SELECT } from './selects/user-profile.select'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UserQueryDto } from './dto/user.query.dto'
import { UserNotFoundException } from './exceptions/user-not-found.exception'

@Injectable()
export class UserProfileRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, username: string, db: Database = this.prisma) {
    return db.userProfile.create({
      data: { userId, username },
      select: USER_PROFILE_SELECT
    })
  }

  async isUsernameTaken(username: string, excludeUserId?: string) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { username },
      select: { userId: true }
    })

    if (!existing) return false
    if (excludeUserId && existing.userId === excludeUserId) return false

    return true
  }

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

  async update(userId: string, dto: UpdateProfileDto) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: dto,
      select: { userId: true, ...USER_PROFILE_SELECT }
    })
  }

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
      select: { userId: true, username: true, displayName: true, avatarUrl: true, createdAt: true },
      orderBy: [{ createdAt: 'desc' }, { userId: 'desc' }],
      take: limit + 1
    })

    const hasMore = profiles.length > limit
    const items = (hasMore ? profiles.slice(0, limit) : profiles).map((p) => ({
      id: p.userId,
      username: p.username,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
    }))
    const last = (hasMore ? profiles.slice(0, limit) : profiles).at(-1)

    const nextCursor = last && hasMore ? encodeCursor(last.createdAt, last.userId) : null

    return { items, meta: { nextCursor, hasMore } }
  }

  async getWithUser(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        username: true,
        avatarUrl: true,
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
