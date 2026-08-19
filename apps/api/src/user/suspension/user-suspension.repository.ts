import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { UserSuspensionCreateDto } from './dto/user-suspension-create.dto'
import { UserAlreadySuspendedException } from './exceptions/user-already-suspended.exception'
import { UserSuspensionNotFoundException } from './exceptions/user-suspension-not-found.exception'

@Injectable()
export class UserSuspensionRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(userId: string, actorUserId: string, dto: UserSuspensionCreateDto, db: Database = this.prisma) {
    try {
      return await db.userSuspension.create({
        data: {
          userId,
          reason: dto.reason,
          suspendedById: actorUserId
        }
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error)) {
        throw new UserAlreadySuspendedException()
      }

      throw error
    }
  }

  async revoke(userId: string, actorUserId: string, db: Database = this.prisma) {
    const result = await db.userSuspension.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedById: actorUserId
      }
    })

    if (result.count === 0) {
      throw new UserSuspensionNotFoundException()
    }
  }

  async getActive(userId: string, db: Database = this.prisma) {
    return db.userSuspension.findFirst({
      where: { userId, revokedAt: null },
      select: { reason: true }
    })
  }
}
