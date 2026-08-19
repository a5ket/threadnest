import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { PlatformRoleGrantCreateDto } from './dto/platform-role-grant-create.dto'
import { PlatformRoleGrantNotFoundException } from './exceptions/platform-role-grant-not-found.exception'
import { UserAlreadyHasActiveRoleException } from './exceptions/user-already-has-active-role.exception'

@Injectable()
export class PlatformRoleGrantRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(userId: string, actorUserId: string, dto: PlatformRoleGrantCreateDto, db: Database = this.prisma) {
    return this.createGrant(userId, actorUserId, dto, db)
  }

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

  async getActiveRole(userId: string, db: Database = this.prisma) {
    const grant = await db.platformRoleGrant.findFirst({
      where: { userId, revokedAt: null },
      select: { role: true }
    })

    return grant?.role ?? null
  }
}
