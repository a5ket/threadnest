import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { BLOCK_SELECT } from './selects/block.select'
import { BLOCKED_USER_SELECT } from './selects/blocked.user.select'
import { AlreadyBlockedException } from './exceptions/already-blocked.exception'
import { NotBlockedException } from './exceptions/not-blocked.exception'

/** Persistence for one-directional user blocks. */
@Injectable()
export class BlockRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param blockerId - The potential blocker.
   * @param blockedId - The potential blocked user.
   * @returns Whether a block row from `blockerId` to `blockedId` exists.
   */
  async exists(blockerId: string, blockedId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
      select: {
        blockedId: true,
      },
    })

    return block !== null
  }

  /**
   * Currently unused by any caller in this codebase — {@link getBlockedUserById} covers the same
   * lookup with the richer blocked-user shape instead.
   *
   * @param blockerId - The blocker.
   * @param blockedId - The blocked user.
   * @returns The block row.
   * @throws {NotBlockedException} No block from `blockerId` to `blockedId` exists.
   */
  async getByUsers(blockerId: string, blockedId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
      select: BLOCK_SELECT,
    })

    if (!block) {
      throw new NotBlockedException()
    }

    return block
  }

  /**
   * Currently unused by any caller in this codebase — {@link createAndSelectBlockedUser} covers
   * the same write with the richer blocked-user shape instead.
   *
   * @param blockerId - The user creating the block.
   * @param blockedId - The user being blocked.
   * @returns The created block row.
   * @throws {AlreadyBlockedException} `blockerId` has already blocked `blockedId`.
   */
  async create(blockerId: string, blockedId: string) {
    try {
      return await this.prisma.userBlock.create({
        data: {
          blockerId,
          blockedId,
        },
        select: BLOCK_SELECT,
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error)) {
        throw new AlreadyBlockedException()
      }

      throw error
    }
  }

  /**
   * @param blockerId - The user removing the block.
   * @param blockedId - The user being unblocked.
   * @throws {NotBlockedException} No block from `blockerId` to `blockedId` exists.
   */
  async deleteByUsers(blockerId: string, blockedId: string) {
    try {
      await this.prisma.userBlock.delete({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new NotBlockedException()
      }

      throw error
    }
  }

  /**
   * Currently unused by any caller in this codebase — {@link listBlockedUsers} covers the same
   * listing with the richer blocked-user shape instead.
   *
   * @param blockerId - The user whose outgoing blocks to list.
   * @returns Every block row created by `blockerId`, newest first.
   */
  listByBlockerId(blockerId: string) {
    return this.prisma.userBlock.findMany({
      where: {
        blockerId,
      },
      select: BLOCK_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Currently unused by any caller in this codebase — nothing today needs "who has blocked this
   * user" (only the inverse, "who has this user blocked").
   *
   * @param blockedId - The user whose incoming blocks to list.
   * @returns Every block row targeting `blockedId`, newest first.
   */
  listByBlockedId(blockedId: string) {
    return this.prisma.userBlock.findMany({
      where: {
        blockedId,
      },
      select: BLOCK_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * @param blockerId - The user creating the block.
   * @param blockedId - The user being blocked.
   * @returns The created block, with the blocked user's public reference data selected.
   * @throws {AlreadyBlockedException} `blockerId` has already blocked `blockedId`.
   */
  async createAndSelectBlockedUser(blockerId: string, blockedId: string) {
    try {
      return await this.prisma.userBlock.create({
        data: {
          blockerId,
          blockedId,
        },
        select: BLOCKED_USER_SELECT,
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error)) {
        throw new AlreadyBlockedException()
      }

      throw error
    }
  }

  /**
   * @param blockerId - The user whose blocklist to fetch.
   * @returns Every block created by `blockerId`, newest first, with blocked-user reference data.
   */
  listBlockedUsers(blockerId: string) {
    return this.prisma.userBlock.findMany({
      where: {
        blockerId,
      },
      select: BLOCKED_USER_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * @param blockerId - The blocker.
   * @param blockedId - The blocked user.
   * @returns The block, with blocked-user reference data selected.
   * @throws {NotBlockedException} No block from `blockerId` to `blockedId` exists.
   */
  async getBlockedUserById(blockerId: string, blockedId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
      select: BLOCKED_USER_SELECT,
    })

    if (!block) {
      throw new NotBlockedException()
    }

    return block
  }
}