import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

@Injectable()
export class SavedThreadRepository {
  constructor(private readonly prisma: PrismaService) { }

  async upsert(threadId: string, userId: string, db: Database = this.prisma) {
    await db.savedThread.upsert({
      where: { userId_threadId: { userId, threadId } },
      create: { threadId, userId },
      update: {}
    })
  }

  async delete(threadId: string, userId: string, db: Database = this.prisma) {
    await db.savedThread.deleteMany({
      where: { threadId, userId }
    })
  }
}
