import { Module } from '@nestjs/common'
import { AuthModule } from 'src/auth/auth.module'
import { BlockModule } from 'src/block/block.module'
import { NestModule } from 'src/nest/nest.module'
import { NotificationModule } from 'src/notification/notification.module'
import { PlatformModule } from 'src/platform/platform.module'
import { SecurityModule } from 'src/security/security.module'
import { ThreadModule } from 'src/thread/thread.module'
import { UserModule } from 'src/user/user.module'
import { MeAuthController } from './me-auth.controller'
import { MeBlockController } from './me-block.controller'
import { MeFeedController } from './me-feed.controller'
import { MeNestInviteController } from './me-nest-invite.controller'
import { MeNestJoinRequestController } from './me-nest-join-request.controller'
import { MeNestPreferenceController } from './me-nest-preference.controller'
import { MeNestController } from './me-nest.controller'
import { MeNotificationController } from './me-notification.controller'
import { MeController } from './me.controller'
import { MeProfileController } from './me-profile.controller'
import { MeSavedThreadController } from './me-saved-thread.controller'
import { MeService } from './me.service'

@Module({
  imports: [
    NestModule,
    AuthModule,
    SecurityModule,
    UserModule,
    BlockModule,
    NotificationModule,
    PlatformModule,
    ThreadModule
  ],
  providers: [
    MeService
  ],
  controllers: [
    MeController,
    MeAuthController,
    MeNestController,
    MeNestPreferenceController,
    MeNestInviteController,
    MeNestJoinRequestController,
    MeProfileController,
    MeBlockController,
    MeNotificationController,
    MeSavedThreadController,
    MeFeedController
  ]
})
export class MeModule { }
