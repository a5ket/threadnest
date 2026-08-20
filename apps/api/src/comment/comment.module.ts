import { Module } from '@nestjs/common'
import { BlockModule } from 'src/block/block.module'
import { EventModule } from 'src/event/event.module'
import { NestModule } from 'src/nest/nest.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { ThreadModule } from 'src/thread/thread.module'
import { UserModule } from 'src/user/user.module'
import { CommentController } from './comment.controller'
import { CommentPolicy } from './comment.policy'
import { CommentPresenter } from './comment.presenter'
import { CommentRepository } from './comment.repository'
import { CommentService } from './comment.service'
import { CommentVoteRepository } from './comment-vote.repository'
import { ThreadCommentController } from './thread-comment.controller'

@Module({
  imports: [PrismaModule, EventModule, SecurityModule, ThreadModule, NestModule, BlockModule, UserModule],
  controllers: [CommentController, ThreadCommentController],
  providers: [CommentRepository, CommentVoteRepository, CommentService, CommentPolicy, CommentPresenter],
  exports: [CommentRepository, CommentService]
})
export class CommentModule { }
