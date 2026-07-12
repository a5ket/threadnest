import { Module } from '@nestjs/common'
import { BlockModule } from 'src/block/block.module'
import { EventModule } from 'src/event/event.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { ThreadModule } from 'src/thread/thread.module'
import { CommentController } from './comment.controller'
import { CommentPolicy } from './comment.policy'
import { CommentPresenter } from './comment.presenter'
import { CommentRepository } from './comment.repository'
import { CommentService } from './comment.service'
import { ThreadCommentController } from './thread-comment.controller'

@Module({
  imports: [PrismaModule, EventModule, ThreadModule, BlockModule],
  controllers: [CommentController, ThreadCommentController],
  providers: [CommentRepository, CommentService, CommentPolicy, CommentPresenter]
})
export class CommentModule { }
