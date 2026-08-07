import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { BLOCK_SELECT } from './selects/block.select'
import { BLOCKED_USER_SELECT } from './selects/blocked.user.select'
import { AlreadyBlockedException } from './exceptions/already-blocked.exception'
import { NotBlockedException } from './exceptions/not-blocked.exception'

@Injectable()
export class BlockRepository {
  constructor(private readonly prisma: PrismaService) { }

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