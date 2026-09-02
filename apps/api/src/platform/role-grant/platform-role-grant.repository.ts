import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { PlatformRoleGrantCreateDto } from './dto/platform-role-grant-create.dto'
import { PlatformRoleGrantNotFoundException } from './exceptions/platform-role-grant-not-found.exception'
import { UserAlreadyHasActiveRoleException } from './exceptions/user-already-has-active-role.exception'

/** Persistence for platform role grants (moderator/admin). One active grant per user at a time. */
@Injectable()
export class PlatformRoleGrantRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  /**
   * @param userId - The user receiving the role.
   * @param actorUserId - The admin granting it, recorded on the grant.
   * @param dto - The role to grant.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created grant.
   * @throws {UserAlreadyHasActiveRoleException} `userId` already has an active grant.
   */
  async create(userId: string, actorUserId: string, dto: PlatformRoleGrantCreateDto, db: Database = this.prisma) {
    return this.createGrant(userId, actorUserId, dto, db)
  }

  /**
   * Same as {@link create}, but with no granting actor — used for system-initiated grants (e.g.
   * bootstrapping the first admin via CLI command) where there's no acting user to attribute it to.
   *
   * @param userId - The user receiving the role.
   * @param dto - The role to grant.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created grant.
   * @throws {UserAlreadyHasActiveRoleException} `userId` already has an active grant.
   */
  async createWithoutActor(userId: string, dto: PlatformRoleGrantCreateDto, db: Database = this.prisma) {
    return this.createGrant(userId, undefined, dto, db)
  }

  private async createGrant(userId: string, actorUserId: string | undefined, dto: PlatformRoleGrantCreateDto, db: Database = this.prisma) {
    try {
      return await db.platformRoleGrant.create({
        data: {
          userId,
          role: dto.role,
          grantedById: actorUserId
        }
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error)) {
        throw new UserAlreadyHasActiveRoleException()
      }

      throw error
    }
  }

  /**
   * @param userId - The user whose active grant to revoke.
   * @param actorUserId - The admin revoking it, recorded on the grant.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @throws {PlatformRoleGrantNotFoundException} `userId` has no active grant to revoke.
   */
  async revoke(userId: string, actorUserId: string, db: Database = this.prisma) {
    const result = await db.platformRoleGrant.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedById: actorUserId
      }
    })

    if (result.count === 0) {
      throw new PlatformRoleGrantNotFoundException()
    }
  }

  /**
   * @param userId - The user to look up.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The user's active platform role, or `null` if they have none.
   */
  async getActiveRole(userId: string, db: Database = this.prisma) {
    const grant = await db.platformRoleGrant.findFirst({
      where: { userId, revokedAt: null },
      select: { role: true }
    })

    return grant?.role ?? null
  }
}
