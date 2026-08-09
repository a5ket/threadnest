import { Injectable } from '@nestjs/common'
import { VoteType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

@Injectable()
export class ThreadVoteRepository {
  constructor(private readonly prisma: PrismaService) { }

  async find(threadId: string, userId: string, db: Database = this.prisma) {
    return db.threadVote.findUnique({
      where: { threadId_userId: { threadId, userId } },
      select: { type: true }
    })
  }

  async upsert(threadId: string, userId: string, type: VoteType, db: Database = this.prisma) {
    await db.threadVote.upsert({
      where: { threadId_userId: { threadId, userId } },
      create: { threadId, userId, type },
      update: { type }
    })
  }

  async delete(threadId: string, userId: string, db: Database = this.prisma) {
    await db.threadVote.deleteMany({
      where: { threadId, userId }
    })
  }
}
