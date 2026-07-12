import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_BAN_SUMMARY_SELECT } from './constants/nest-ban.summary.select'
import { BanNotFoundException } from './exceptions/ban-not-found.exception'
import { UserAlreadyBannedException } from './exceptions/user-already-banned.exception'
import { NestBanStatus } from 'generated/prisma/enums'

@Injectable()
export class NestBanRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

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
        }
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error)) {
        throw new UserAlreadyBannedException()
      }

      throw error
    }
  }

  async revoke(nestId: string, userId: string, revokedById: string, db: Database = this.prisma) {
    try {
      return await db.nestBan.update({
        where: { nestId_userId: { nestId, userId } },
        data: {
          status: NestBanStatus.REVOKED,
          revokedAt: new Date(),
          revokedById,
        }
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new BanNotFoundException()
      }

      throw error
    }
  }

  async listSummaryByNestId(nestId: string) {
    return this.prisma.nestBan.findMany({
      where: {
        nestId
      },
      select: NEST_BAN_SUMMARY_SELECT
    })
  }
}