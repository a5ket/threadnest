import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'

/** Persistence for a viewer's saved-threads list. */
@Injectable()
export class SavedThreadRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param threadId - The thread to save.
   * @param userId - The saving user.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async upsert(threadId: string, userId: string, db: Database = this.prisma) {
    await db.savedThread.upsert({
      where: { userId_threadId: { userId, threadId } },
      create: { threadId, userId },
      update: {}
    })
  }

  /**
   * @param threadId - The thread to unsave.
   * @param userId - The user unsaving it.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   */
  async delete(threadId: string, userId: string, db: Database = this.prisma) {
    await db.savedThread.deleteMany({
      where: { threadId, userId }
    })
  }
}
