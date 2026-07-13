import { Module } from '@nestjs/common'
import { EventModule } from 'src/event/event.module'
import { NestModule } from 'src/nest/nest.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { NestThreadController } from './nest-thread.controller'
import { ThreadAccess } from './thread.access'
import { ThreadPolicy } from './thread.policy'
import { ThreadPresenter } from './thread.presenter'
import { ThreadRepository } from './thread.repository'
import { ThreadService } from './thread.service'

@Module({
  imports: [
    PrismaModule,
    NestModule,
    EventModule,
    SecurityModule
  ],
  providers: [
    ThreadRepository,
    ThreadAccess,
    ThreadPolicy,
    ThreadPresenter,
    ThreadService
  ],
  controllers: [
    NestThreadController
  ],
  exports: [ThreadRepository, ThreadService, ThreadAccess, ThreadPolicy, ThreadPresenter]
})
export class ThreadModule { }
