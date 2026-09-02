import { Injectable } from '@nestjs/common'
import { VoteType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

/** Persistence for a viewer's vote on a comment — one row per (comment, user). */
@Injectable()
export class CommentVoteRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param commentId - The comment to check.
   * @param userId - The voter.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The voter's current vote type, or `null` if they haven't voted.
   */
  async find(commentId: string, userId: string, db: Database = this.prisma) {
    return db.commentVote.findUnique({
      where: { commentId_userId: { commentId, userId } },
      select: { type: true }
    })
  }

  /**
   * @param commentId - The comment being voted on.
   * @param userId - The voter.
   * @param type - The vote to record, replacing any existing vote.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async upsert(commentId: string, userId: string, type: VoteType, db: Database = this.prisma) {
    await db.commentVote.upsert({
      where: { commentId_userId: { commentId, userId } },
      create: { commentId, userId, type },
      update: { type }
    })
  }

  /**
   * @param commentId - The comment to remove the vote from.
   * @param userId - The voter.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async delete(commentId: string, userId: string, db: Database = this.prisma) {
    await db.commentVote.deleteMany({
      where: { commentId, userId }
    })
  }
}
