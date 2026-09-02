import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { NestInviteStatus } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_INVITE_MANAGEMENT_SELECT } from './selects/nest-invite.management.select'
import { NEST_INVITE_PERSONAL_SELECT } from './selects/nest-invite.personal.select'
import { NEST_INVITE_SUMMARY_SELECT } from './selects/nest-invite.summary.select'
import { AlreadyInvitedException } from './exceptions/already-invited.exception'
import { NestInviteNotFoundException } from './exceptions/nest-invite-not-found.exception'

/** Persistence for nest invites. */
@Injectable()
export class NestInviteRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param inviteId - The invite to fetch.
   * @param select - The Prisma select shape, generic so callers can request exactly the fields
   * they need without a separate query method per shape.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The invite in the requested shape, or `null` if it doesn't exist.
   */
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

  /**
   * @param inviteId - The invite to fetch.
   * @param select - The Prisma select shape.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The invite in the requested shape.
   * @throws {NestInviteNotFoundException} No invite with this id.
   */
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

  /** @param inviteId - The invite to fetch. */
  findSummary(inviteId: string, db?: Database) {
    return this.findById(inviteId, NEST_INVITE_SUMMARY_SELECT, db)
  }

  /**
   * @param inviteId - The invite to fetch.
   * @throws {NestInviteNotFoundException} No invite with this id.
   */
  getSummary(inviteId: string, db?: Database) {
    return this.getById(inviteId, NEST_INVITE_SUMMARY_SELECT, db)
  }

  /** @param nestId - The nest whose sent invites to list, in the nest-management view shape. */
  listAsNest(nestId: string, db: Database = this.prisma) {
    return db.nestInvite.findMany({
      where: { nestId },
      select: NEST_INVITE_MANAGEMENT_SELECT,
    })
  }

  /** @param userId - The user whose received invites to list, in the recipient's own view shape. */
  listAsUser(userId: string, db: Database = this.prisma) {
    return db.nestInvite.findMany({
      where: { userId },
      select: NEST_INVITE_PERSONAL_SELECT,
    })
  }

  /**
   * @param nestId - The nest the invite would be for.
   * @param userId - The prospective invitee.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns Whether `userId` already has a pending invite to `nestId`.
   */
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

  /**
   * @param nestId - The nest to invite the user to.
   * @param userId - The invitee.
   * @param invitedById - The nest member sending the invite.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created invite.
   * @throws {AlreadyInvitedException} `userId` already has a pending invite to `nestId`.
   */
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

  /**
   * Shared terminal-status transition behind {@link accept}/{@link decline}/{@link revoke}.
   *
   * @param inviteId - The invite to resolve.
   * @param resolvedById - The user resolving it — the invitee for accept/decline, a nest manager
   * for revoke.
   * @param status - The terminal status to set.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @throws {NestInviteNotFoundException} No invite with this id.
   */
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

  /**
   * @param inviteId - The invite to accept.
   * @param actorUserId - The invitee.
   * @throws {NestInviteNotFoundException} No invite with this id.
   */
  accept(inviteId: string, actorUserId: string, db?: Database) {
    return this.resolve(inviteId, actorUserId, NestInviteStatus.ACCEPTED, db)
  }

  /**
   * @param inviteId - The invite to decline.
   * @param actorUserId - The invitee.
   * @throws {NestInviteNotFoundException} No invite with this id.
   */
  decline(inviteId: string, actorUserId: string, db?: Database) {
    return this.resolve(inviteId, actorUserId, NestInviteStatus.DECLINED, db)
  }

  /**
   * @param inviteId - The invite to revoke.
   * @param actorUserId - The nest manager revoking it.
   * @throws {NestInviteNotFoundException} No invite with this id.
   */
  revoke(inviteId: string, actorUserId: string, db?: Database) {
    return this.resolve(inviteId, actorUserId, NestInviteStatus.REVOKED, db)
  }
}