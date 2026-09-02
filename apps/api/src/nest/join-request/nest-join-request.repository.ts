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

/** Persistence for nest join requests. */
@Injectable()
export class NestJoinRequestRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param requestId - The join request to fetch.
   * @param select - The Prisma select shape, generic so callers can request exactly the fields
   * they need without a separate query method per shape.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The request in the requested shape, or `null` if it doesn't exist.
   */
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

  /**
   * @param requestId - The join request to fetch.
   * @param select - The Prisma select shape.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The request in the requested shape.
   * @throws {NestJoinRequestNotFoundException} No request with this id.
   */
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

  /** @param requestId - The join request to fetch, in the full policy-subject shape. */
  find(requestId: string, db?: Database) {
    return this.findById(requestId, NEST_JOIN_REQUEST_SELECT, db)
  }

  /**
   * @param requestId - The join request to fetch, in the full policy-subject shape.
   * @throws {NestJoinRequestNotFoundException} No request with this id.
   */
  get(requestId: string, db?: Database) {
    return this.getById(requestId, NEST_JOIN_REQUEST_SELECT, db)
  }

  /** @param requestId - The join request to fetch. */
  findSummary(requestId: string, db?: Database) {
    return this.findById(requestId, NEST_JOIN_REQUEST_SUMMARY_SELECT, db)
  }

  /**
   * @param requestId - The join request to fetch.
   * @throws {NestJoinRequestNotFoundException} No request with this id.
   */
  getSummary(requestId: string, db?: Database) {
    return this.getById(requestId, NEST_JOIN_REQUEST_SUMMARY_SELECT, db)
  }

  /** @param nestId - The nest whose received join requests to list, in the nest-management view shape. */
  listAsNest(nestId: string, db: Database = this.prisma) {
    return db.nestJoinRequest.findMany({
      where: { nestId },
      select: NEST_JOIN_REQUEST_MANAGEMENT_SELECT,
    })
  }

  /** @param userId - The user whose sent join requests to list, in the requester's own view shape. */
  listAsUser(userId: string, db: Database = this.prisma) {
    return db.nestJoinRequest.findMany({
      where: { userId },
      select: NEST_JOIN_REQUEST_PERSONAL_SELECT,
    })
  }

  /**
   * @param nestId - The nest the request would be for.
   * @param userId - The prospective requester.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns Whether `userId` already has a pending join request for `nestId`.
   */
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

  /**
   * @param nestId - The nest to request to join.
   * @param userId - The requester.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created join request.
   * @throws {AlreadyHasPendingJoinRequestException} `userId` already has a pending request for `nestId`.
   */
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

  /**
   * Shared terminal-status transition behind {@link cancel}/{@link approve}/{@link reject}.
   *
   * @param requestId - The join request to resolve.
   * @param resolvedById - The user resolving it — the requester for cancel, a nest manager for
   * approve/reject.
   * @param status - The terminal status to set.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @throws {NestJoinRequestNotFoundException} No request with this id.
   */
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

  /**
   * @param requestId - The join request to cancel.
   * @param actorUserId - The requester.
   * @throws {NestJoinRequestNotFoundException} No request with this id.
   */
  cancel(requestId: string, actorUserId: string, db?: Database) {
    return this.resolve(requestId, actorUserId, NestJoinRequestStatus.CANCELED, db)
  }

  /**
   * @param requestId - The join request to approve.
   * @param actorUserId - The nest manager approving it.
   * @throws {NestJoinRequestNotFoundException} No request with this id.
   */
  approve(requestId: string, actorUserId: string, db?: Database) {
    return this.resolve(requestId, actorUserId, NestJoinRequestStatus.APPROVED, db)
  }

  /**
   * @param requestId - The join request to reject.
   * @param actorUserId - The nest manager rejecting it.
   * @throws {NestJoinRequestNotFoundException} No request with this id.
   */
  reject(requestId: string, actorUserId: string, db?: Database) {
    return this.resolve(requestId, actorUserId, NestJoinRequestStatus.REJECTED, db)
  }
}