import { Module } from '@nestjs/common'
import { AuthModule } from 'src/auth/auth.module'
import { BlockModule } from 'src/block/block.module'
import { NestModule } from 'src/nest/nest.module'
import { SecurityModule } from 'src/security/security.module'
import { UserModule } from 'src/user/user.module'
import { MeAuthController } from './me-auth.controller'
import { MeNestInviteController } from './me-nest-invite.controller'
import { MeNestJoinRequestController } from './me-nest-join-request.controller'
import { MeNestController } from './me-nest.controller'
import { MeNestPreferenceController } from './me-nest-preference.controller'
import { MeProfileController } from './me-profile.controller'
import { MeBlockController } from './me-block.controller'

@Module({
  imports: [NestModule, AuthModule, SecurityModule, UserModule, BlockModule],
  controllers: [MeAuthController, MeNestController, MeNestPreferenceController, MeNestInviteController, MeNestJoinRequestController, MeProfileController, MeBlockController]
})
export class MeModule { }
