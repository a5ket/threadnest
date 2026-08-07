import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { NestJoinRequestStatus } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_JOIN_REQUEST_MANAGEMENT_SELECT } from './selects/nest-join-request.management.select'
import { NEST_JOIN_REQUEST_PERSONAL_SELECT } from './selects/nest-join-request.personal.select'
import { NEST_JOIN_REQUEST_SELECT } from './selects/nest-join-request.select'
import { NEST_JOIN_REQUEST_SUMMARY_SELECT } from './selects/nest-join-request.summary.select'
import { AlreadyHasPendingJoinRequestException } from './exceptions/already-has-pending-join-request.exception'
import { NestJoinRequestNotFoundException } from './exceptions/nest-join-request-not-found.exception'

@Injectable()
export class NestJoinRequestRepository {
  constructor(private readonly prisma: PrismaService) { }

  private findById<T extends Prisma.NestJoinRequestSelect>(
    requestId: string,
    select: T,
    db: Database = this.prisma,
  ) {
    return db.nestJoinRequest.findUnique({
      where: { id: requestId },
      select,
    })
  }

  private async getById<T extends Prisma.NestJoinRequestSelect>(
    requestId: string,
    select: T,
    db: Database = this.prisma,
  ) {
    const request = await this.findById(requestId, select, db)

    if (!request) {
      throw new NestJoinRequestNotFoundException()
    }

    return request
  }

  find(requestId: string, db?: Database) {
    return this.findById(requestId, NEST_JOIN_REQUEST_SELECT, db)
  }

  get(requestId: string, db?: Database) {
    return this.getById(requestId, NEST_JOIN_REQUEST_SELECT, db)
  }

  findSummary(requestId: string, db?: Database) {
    return this.findById(requestId, NEST_JOIN_REQUEST_SUMMARY_SELECT, db)
  }

  getSummary(requestId: string, db?: Database) {
    return this.getById(requestId, NEST_JOIN_REQUEST_SUMMARY_SELECT, db)
  }

  listAsNest(nestId: string, db: Database = this.prisma) {
    return db.nestJoinRequest.findMany({
      where: { nestId },
      select: NEST_JOIN_REQUEST_MANAGEMENT_SELECT,
    })
  }

  listAsUser(userId: string, db: Database = this.prisma) {
    return db.nestJoinRequest.findMany({
      where: { userId },
      select: NEST_JOIN_REQUEST_PERSONAL_SELECT,
    })
  }

  async existsPending(
    nestId: string,
    userId: string,
    db: Database = this.prisma,
  ) {
    const request = await db.nestJoinRequest.findFirst({
      where: {
        nestId,
        userId,
        status: NestJoinRequestStatus.PENDING,
      },
      select: { id: true },
    })

    return Boolean(request)
  }

  async create(
    nestId: string,
    userId: string,
    db: Database = this.prisma,
  ) {
    try {
      return await db.nestJoinRequest.create({
        data: {
          nestId,
          userId,
        },
        select: NEST_JOIN_REQUEST_SUMMARY_SELECT,
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error)) {
        throw new AlreadyHasPendingJoinRequestException()
      }

      throw error
    }
  }

  private async resolve(
    requestId: string,
    resolvedById: string,
    status: NestJoinRequestStatus,
    db: Database = this.prisma,
  ) {
    try {
      await db.nestJoinRequest.update({
        where: { id: requestId },
        data: {
          status,
          resolvedById,
          resolvedAt: new Date(),
        },
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new NestJoinRequestNotFoundException()
      }

      throw error
    }
  }

  cancel(requestId: string, actorUserId: string, db?: Database) {
    return this.resolve(requestId, actorUserId, NestJoinRequestStatus.CANCELED, db)
  }

  approve(requestId: string, actorUserId: string, db?: Database) {
    return this.resolve(requestId, actorUserId, NestJoinRequestStatus.APPROVED, db)
  }

  reject(requestId: string, actorUserId: string, db?: Database) {
    return this.resolve(requestId, actorUserId, NestJoinRequestStatus.REJECTED, db)
  }
}