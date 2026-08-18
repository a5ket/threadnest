import { Module } from '@nestjs/common'
import { EventModule } from 'src/event/event.module'
import { NestModule } from 'src/nest/nest.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { NestThreadController } from './nest-thread.controller'
import { ThreadController } from './thread.controller'
import { ThreadAccess } from './thread.access'
import { ThreadPolicy } from './thread.policy'
import { ThreadPresenter } from './thread.presenter'
import { ThreadRepository } from './thread.repository'
import { ThreadService } from './thread.service'
import { ThreadVoteRepository } from './thread-vote.repository'

@Module({
  imports: [
    PrismaModule,
    NestModule,
    EventModule,
    SecurityModule
  ],
  providers: [
    ThreadRepository,
    ThreadVoteRepository,
    ThreadAccess,
    ThreadPolicy,
    ThreadPresenter,
    ThreadService
  ],
  controllers: [
    NestThreadController,
    ThreadController
  ],
  exports: [ThreadRepository, ThreadVoteRepository, ThreadService, ThreadAccess, ThreadPresenter]
})
export class ThreadModule { }
