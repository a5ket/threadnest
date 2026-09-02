import { Injectable } from '@nestjs/common'
import { VoteType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

/** Persistence for a viewer's vote on a thread — one row per (thread, user). */
@Injectable()
export class ThreadVoteRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param threadId - The thread to check.
   * @param userId - The voter.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The voter's current vote type, or `null` if they haven't voted.
   */
  async find(threadId: string, userId: string, db: Database = this.prisma) {
    return db.threadVote.findUnique({
      where: { threadId_userId: { threadId, userId } },
      select: { type: true }
    })
  }

  /**
   * @param threadId - The thread being voted on.
   * @param userId - The voter.
   * @param type - The vote to record, replacing any existing vote.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async upsert(threadId: string, userId: string, type: VoteType, db: Database = this.prisma) {
    await db.threadVote.upsert({
      where: { threadId_userId: { threadId, userId } },
      create: { threadId, userId, type },
      update: { type }
    })
  }

  /**
   * @param threadId - The thread to remove the vote from.
   * @param userId - The voter.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async delete(threadId: string, userId: string, db: Database = this.prisma) {
    await db.threadVote.deleteMany({
      where: { threadId, userId }
    })
  }
}
