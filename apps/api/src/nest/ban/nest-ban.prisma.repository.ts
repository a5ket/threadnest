import { Injectable } from '@nestjs/common'
import { NestBanStatus } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { BanNotFoundException } from './exceptions/ban-not-found.exception'
import { UserAlreadyBannedException } from './exceptions/user-already-banned.exception'
import { NestBanRepository } from './nest-ban.repository'
import { NEST_BAN_SUMMARY_SELECT } from './selects/nest-ban.summary.select'

/** Prisma implementation of {@link NestBanRepository} — see that abstract class for the method contracts. */
@Injectable()
export class NestBanPrismaRepository extends NestBanRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { super() }

  async findByNestIdAndUserId(nestId: string, userId: string) {
    return await this.prisma.nestBan.findUnique({
      where: {
        nestId_userId: {
          nestId,
          userId
        }
      }
    })
  }

  async existsActive(nestId: string, userId: string) {
    const ban = await this.prisma.nestBan.findFirst({
      where: {
        nestId,
        userId,
        status: NestBanStatus.ACTIVE
      },
      select: {
        userId: true
      }
    })

    return Boolean(ban)
  }

  async create(nestId: string, userId: string, bannedById: string, db: Database = this.prisma) {
    try {
      return await db.nestBan.create({
        data: {
          nestId,
          userId,
          bannedById
        },
        select: NEST_BAN_SUMMARY_SELECT
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error)) {
        throw new UserAlreadyBannedException()
      }

      throw error
    }
  }

  async revoke(nestId: string, userId: string, revokedById: string, db: Database = this.prisma) {
    const result = await db.nestBan.updateMany({
      where: { nestId, userId, status: NestBanStatus.ACTIVE },
      data: {
        status: NestBanStatus.REVOKED,
        revokedAt: new Date(),
        revokedById,
      }
    })

    if (result.count === 0) {
      throw new BanNotFoundException()
    }
  }

  async listSummaryByNestId(nestId: string) {
    return this.prisma.nestBan.findMany({
      where: {
        nestId,
        status: NestBanStatus.ACTIVE
      },
      select: NEST_BAN_SUMMARY_SELECT
    })
  }
}
