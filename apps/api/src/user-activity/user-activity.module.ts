import { Module } from '@nestjs/common'
import { CommentModule } from 'src/comment/comment.module'
import { SecurityModule } from 'src/security/security.module'
import { ThreadModule } from 'src/thread/thread.module'
import { UserModule } from 'src/user/user.module'
import { UserActivityController } from './user-activity.controller'
import { UserActivityService } from './user-activity.service'

@Module({
  imports: [UserModule, ThreadModule, CommentModule, SecurityModule],
  controllers: [UserActivityController],
  providers: [UserActivityService]
})
export class UserActivityModule { }
