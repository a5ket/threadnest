import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { NestInviteStatus } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_INVITE_MANAGEMENT_SELECT } from './constants/nest-invite.management.select'
import { NEST_INVITE_PERSONAL_SELECT } from './constants/nest-invite.personal.select'
import { NEST_INVITE_SUMMARY_SELECT } from './constants/nest-invite.summary.select'
import { AlreadyInvitedException } from './exceptions/already-invited.exception'
import { NestInviteNotFoundException } from './exceptions/nest-invite-not-found.exception'

@Injectable()
export class NestInviteRepository {
  constructor(private readonly prisma: PrismaService) { }

  private findById<T extends Prisma.NestInviteSelect>(
    inviteId: string,
    select: T,
    db: Database = this.prisma,
  ) {
    return db.nestInvite.findUnique({
      where: { id: inviteId },
      select,
    })
  }

  private async getById<T extends Prisma.NestInviteSelect>(
    inviteId: string,
    select: T,
    db: Database = this.prisma,
  ) {
    const invite = await this.findById(inviteId, select, db)

    if (!invite) {
      throw new NestInviteNotFoundException()
    }

    return invite
  }

  findSummary(inviteId: string, db?: Database) {
    return this.findById(inviteId, NEST_INVITE_SUMMARY_SELECT, db)
  }

  getSummary(inviteId: string, db?: Database) {
    return this.getById(inviteId, NEST_INVITE_SUMMARY_SELECT, db)
  }

  listAsNest(nestId: string, db: Database = this.prisma) {
    return db.nestInvite.findMany({
      where: { nestId },
      select: NEST_INVITE_MANAGEMENT_SELECT,
    })
  }

  listAsUser(userId: string, db: Database = this.prisma) {
    return db.nestInvite.findMany({
      where: { userId },
      select: NEST_INVITE_PERSONAL_SELECT,
    })
  }

  async existsPending(
    nestId: string,
    userId: string,
    db: Database = this.prisma,
  ) {
    const invite = await db.nestInvite.findFirst({
      where: {
        nestId,
        userId,
        status: NestInviteStatus.PENDING,
      },
      select: { id: true },
    })

    return Boolean(invite)
  }

  async create(
    nestId: string,
    userId: string,
    invitedById: string,
    db: Database = this.prisma,
  ) {
    try {
      return await db.nestInvite.create({
        data: {
          nestId,
          userId,
          invitedById,
        },
        select: NEST_INVITE_SUMMARY_SELECT,
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error)) {
        throw new AlreadyInvitedException()
      }

      throw error
    }
  }

  private async resolve(
    inviteId: string,
    resolvedById: string,
    status: NestInviteStatus,
    db: Database = this.prisma,
  ) {
    try {
      await db.nestInvite.update({
        where: { id: inviteId },
        data: {
          status,
          resolvedById,
          resolvedAt: new Date(),
        },
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new NestInviteNotFoundException()
      }

      throw error
    }
  }

  accept(inviteId: string, actorUserId: string, db?: Database) {
    return this.resolve(inviteId, actorUserId, NestInviteStatus.ACCEPTED, db)
  }

  decline(inviteId: string, actorUserId: string, db?: Database) {
    return this.resolve(inviteId, actorUserId, NestInviteStatus.DECLINED, db)
  }

  revoke(inviteId: string, actorUserId: string, db?: Database) {
    return this.resolve(inviteId, actorUserId, NestInviteStatus.REVOKED, db)
  }
}