import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { NestMemberRole } from 'generated/prisma/enums'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { USER_REFERENCE_SELECT } from 'src/user/constants/user.reference.select'
import { NEST_REFERENCE_SELECT } from '../constants/nest-reference.select'
import { NEST_SUMMARY_SELECT } from '../constants/nest.summary.select'
import { NEST_MEMBER_SELECT } from './constants/nest-member.select'
import { NestMemberQueryDto } from './dto/nest-member.query.dto'
import { AlreadyMemberException } from './exceptions/already-member.exception'
import { MemberNotFoundException } from './exceptions/member-not-found.exception'

@Injectable()
export class NestMemberRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByUser(nestId: string, userId: string) {
    return this.prisma.nestMember.findUnique({
      where: { nestId_userId: { nestId, userId } },
      select: NEST_MEMBER_SELECT
    })
  }

  async getByUser(nestId: string, userId: string) {
    const membership = await this.findByUser(nestId, userId)

    if (!membership) {
      throw new MemberNotFoundException()
    }

    return membership
  }

  async exists(nestId: string, userId: string) {
    const membership = await this.prisma.nestMember.findUnique({
      where: {
        nestId_userId: {
          nestId,
          userId
        }
      },
      select: {
        userId: true
      }
    })

    return Boolean(membership)
  }

  async listByNestId(nestId: string, query: NestMemberQueryDto) {
    const { limit, cursor } = query

    let cursorWhere = {}

    if (cursor) {
      try {
        const { date, id } = decodeCursor(cursor)
        cursorWhere = { OR: [{ createdAt: { gt: date } }, { createdAt: date, userId: { gt: id } }] }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const members = await this.prisma.nestMember.findMany({
      where: { nestId, ...cursorWhere },
      select: { role: true, createdAt: true, userId: true, user: { select: USER_REFERENCE_SELECT } },
      orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }],
      take: limit + 1
    })

    const hasMore = members.length > limit
    const items = hasMore ? members.slice(0, limit) : members
    const last = items.at(-1)
    const nextCursor = last && hasMore ? encodeCursor(last.createdAt, last.userId) : null

    return { data: items, pagination: { nextCursor, hasMore } }
  }

  async deleteByUserId(nestId: string, userId: string, db: Database = this.prisma) {
    try {
      await db.nestMember.delete({
        where: { nestId_userId: { nestId, userId } }
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new MemberNotFoundException()
      }

      throw error
    }
  }

  async deleteIfExistsByUserId(nestId: string, userId: string, db: Database = this.prisma) {
    return db.nestMember.deleteMany({
      where: {
        nestId,
        userId
      }
    })
  }

  async updateRole(nestId: string, userId: string, role: NestMemberRole, db: Database = this.prisma) {
    return db.nestMember.update({
      where: { nestId_userId: { nestId, userId } },
      data: { role },
      select: NEST_MEMBER_SELECT,
    })
  }

  async countByRole(userId: string, role: NestMemberRole) {
    return this.prisma.nestMember.count({
      where: { userId, role }
    })
  }

  async listMembershipsByUser(userId: string) {
    return this.listMemberhipsWithNest(userId, NEST_SUMMARY_SELECT)
  }

  async listMembershipReferencesByUser(userId: string) {
    return this.listMemberhipsWithNest(userId, NEST_REFERENCE_SELECT)
  }

  async createMember(
    nestId: string,
    userId: string,
    db: Database = this.prisma,
  ) {
    return this.createWithRole(nestId, userId, NestMemberRole.MEMBER, db)
  }

  async createOwner(
    nestId: string,
    userId: string,
    db: Database = this.prisma,
  ) {
    return this.createWithRole(nestId, userId, NestMemberRole.OWNER, db)
  }

  private async listMemberhipsWithNest<TSelect extends Prisma.NestSelect>(userId: string, nestSelect: TSelect) {
    return this.prisma.nestMember.findMany({
      where: { userId },
      select: {
        role: true,
        createdAt: true,
        nest: { select: nestSelect }
      }
    })
  }

  private async createWithRole(
    nestId: string,
    userId: string,
    role: NestMemberRole,
    db: Database,
  ) {
    try {
      return await db.nestMember.create({
        data: {
          nestId,
          userId,
          role,
        },
        select: NEST_MEMBER_SELECT,
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error)) {
        throw new AlreadyMemberException()
      }

      throw error
    }
  }
}
