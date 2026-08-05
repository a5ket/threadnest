import { Module } from '@nestjs/common'
import { EventModule } from 'src/event/event.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { UserModule } from 'src/user/user.module'
import { NestBanController } from './ban/nest-ban.controller'
import { NestBanPolicy } from './ban/nest-ban.policy'
import { NestBanPresenter } from './ban/nest-ban.presenter'
import { NestBanRepository } from './ban/nest-ban.repository'
import { NestBanService } from './ban/nest-ban.service'
import { NestInviteCollectionController } from './invite/nest-invite.controller'
import { NestInvitePolicy } from './invite/nest-invite.policy'
import { NestInvitePresenter } from './invite/nest-invite.presenter'
import { NestInviteRepository } from './invite/nest-invite.repository'
import { NestInviteService } from './invite/nest-invite.service'
import { NestJoinRequestCollectionController } from './join-request/nest-join-request.controller'
import { NestJoinRequestPolicy } from './join-request/nest-join-request.policy'
import { NestJoinRequestPresenter } from './join-request/nest-join-request.presenter'
import { NestJoinRequestRepository } from './join-request/nest-join-request.repository'
import { NestJoinRequestService } from './join-request/nest-join-request.service'
import { NestMemberController } from './member/nest-member.controller'
import { NestMemberPolicy } from './member/nest-member.policy'
import { NestMemberRepository } from './member/nest-member.repository'
import { NestMemberService } from './member/nest-member.service'
import { NestSlugController } from './nest-slug.controller'
import { NestAccess } from './nest.access'
import { NestController } from './nest.controller'
import { NestPolicy } from './nest.policy'
import { NestPresenter } from './nest.presenter'
import { NestRepository } from './nest.repository'
import { NestService } from './nest.service'
import { UserNestPreferencePolicy } from './preferences/user-nest-preference.policy'
import { UserNestPreferenceRepository } from './preferences/user-nest-preference.repository'
import { UserNestPreferenceService } from './preferences/user-nest-preference.service'
import { NestSettingsController } from './settings/nest-settings.controller'
import { NestSettingsPolicy } from './settings/nest-settings.policy'
import { NestSettingsRepository } from './settings/nest-settings.repository'
import { NestSettingsService } from './settings/nest-settings.service'

@Module({
  imports: [
    PrismaModule,
    EventModule,
    SecurityModule,
    UserModule
  ],
  controllers: [
    NestController,
    NestSlugController,
    NestMemberController,
    NestBanController,
    NestInviteCollectionController,
    NestJoinRequestCollectionController,
    NestSettingsController
  ],
  providers: [
    NestRepository,
    NestMemberRepository,
    NestBanRepository,
    NestInviteRepository,
    NestJoinRequestRepository,
    NestSettingsRepository,
    UserNestPreferenceRepository,
    NestService,
    UserNestPreferenceService,
    NestMemberService,
    NestBanService,
    NestInviteService,
    NestJoinRequestService,
    NestSettingsService,
    NestMemberPolicy,
    NestBanPolicy,
    NestInvitePolicy,
    NestJoinRequestPolicy,
    NestSettingsPolicy,
    UserNestPreferencePolicy,
    NestInvitePresenter,
    NestJoinRequestPresenter,
    NestBanPresenter,
    NestAccess,
    NestPresenter,
    NestPolicy
  ],
  exports: [
    NestRepository,
    NestService,
    NestMemberService,
    NestInviteService,
    NestJoinRequestService,
    UserNestPreferenceService,
    NestAccess
  ]
})
export class NestModule { }
