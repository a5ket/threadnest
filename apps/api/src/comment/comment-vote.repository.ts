import { Injectable } from '@nestjs/common'
import { VoteType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

@Injectable()
export class CommentVoteRepository {
  constructor(private readonly prisma: PrismaService) { }

  async find(commentId: string, userId: string, db: Database = this.prisma) {
    return db.commentVote.findUnique({
      where: { commentId_userId: { commentId, userId } },
      select: { type: true }
    })
  }

  async upsert(commentId: string, userId: string, type: VoteType, db: Database = this.prisma) {
    await db.commentVote.upsert({
      where: { commentId_userId: { commentId, userId } },
      create: { commentId, userId, type },
      update: { type }
    })
  }

  async delete(commentId: string, userId: string, db: Database = this.prisma) {
    await db.commentVote.deleteMany({
      where: { commentId, userId }
    })
  }
}
