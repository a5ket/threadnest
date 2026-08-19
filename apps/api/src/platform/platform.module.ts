import { Module } from '@nestjs/common'
import { CommentModule } from 'src/comment/comment.module'
import { EventModule } from 'src/event/event.module'
import { ThreadModule } from 'src/thread/thread.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { UserModule } from 'src/user/user.module'
import { PlatformActionLogController } from './action-log/platform-action-log.controller'
import { PlatformActionLogPolicy } from './action-log/platform-action-log.policy'
import { PlatformActionLogPresenter } from './action-log/platform-action-log.presenter'
import { PlatformActionLogRepository } from './action-log/platform-action-log.repository'
import { PlatformActionLogService } from './action-log/platform-action-log.service'
import { PlatformCommentRemovedActionLogSubscriber } from './action-log/subscribers/comment-removed.subscriber'
import { PlatformContentBulkRemovedActionLogSubscriber } from './action-log/subscribers/content-bulk-removed.subscriber'
import { PlatformReportReviewedActionLogSubscriber } from './action-log/subscribers/report-reviewed.subscriber'
import { PlatformRoleChangedActionLogSubscriber } from './action-log/subscribers/role-changed.subscriber'
import { PlatformRoleGrantedActionLogSubscriber } from './action-log/subscribers/role-granted.subscriber'
import { PlatformRoleRevokedActionLogSubscriber } from './action-log/subscribers/role-revoked.subscriber'
import { PlatformThreadRemovedActionLogSubscriber } from './action-log/subscribers/thread-removed.subscriber'
import { PlatformUserSuspendedActionLogSubscriber } from './action-log/subscribers/user-suspended.subscriber'
import { PlatformUserUnsuspendedActionLogSubscriber } from './action-log/subscribers/user-unsuspended.subscriber'
import { GrantAdminCommand } from './commands/grant-admin.command'
import { PlatformContentController } from './content/platform-content.controller'
import { PlatformContentPolicy } from './content/platform-content.policy'
import { PlatformContentService } from './content/platform-content.service'
import { PlatformAccess } from './platform.access'
import { PlatformController } from './platform.controller'
import { PlatformService } from './platform.service'
import { PlatformReportController } from './report/platform-report.controller'
import { PlatformReportPolicy } from './report/platform-report.policy'
import { PlatformReportPresenter } from './report/platform-report.presenter'
import { PlatformReportRepository } from './report/platform-report.repository'
import { PlatformReportService } from './report/platform-report.service'
import { PlatformRoleGrantController } from './role-grant/platform-role-grant.controller'
import { PlatformRoleGrantPolicy } from './role-grant/platform-role-grant.policy'
import { PlatformRoleGrantPresenter } from './role-grant/platform-role-grant.presenter'
import { PlatformRoleGrantRepository } from './role-grant/platform-role-grant.repository'
import { PlatformRoleGrantService } from './role-grant/platform-role-grant.service'
import { PlatformUserSuspensionController } from './suspension/platform-user-suspension.controller'
import { PlatformUserSuspensionPolicy } from './suspension/platform-user-suspension.policy'
import { PlatformUserSuspensionService } from './suspension/platform-user-suspension.service'

@Module({
  imports: [PrismaModule, SecurityModule, UserModule, ThreadModule, CommentModule, EventModule],
  providers: [
    PlatformService,
    PlatformAccess,
    PlatformRoleGrantRepository,
    PlatformRoleGrantPolicy,
    PlatformRoleGrantPresenter,
    PlatformRoleGrantService,
    PlatformUserSuspensionPolicy,
    PlatformUserSuspensionService,
    PlatformReportRepository,
    PlatformReportPolicy,
    PlatformReportPresenter,
    PlatformReportService,
    PlatformContentPolicy,
    PlatformContentService,
    PlatformActionLogRepository,
    PlatformActionLogPolicy,
    PlatformActionLogPresenter,
    PlatformActionLogService,
    PlatformRoleGrantedActionLogSubscriber,
    PlatformRoleChangedActionLogSubscriber,
    PlatformRoleRevokedActionLogSubscriber,
    PlatformUserSuspendedActionLogSubscriber,
    PlatformUserUnsuspendedActionLogSubscriber,
    PlatformThreadRemovedActionLogSubscriber,
    PlatformCommentRemovedActionLogSubscriber,
    PlatformContentBulkRemovedActionLogSubscriber,
    PlatformReportReviewedActionLogSubscriber,
    GrantAdminCommand
  ],
  controllers: [
    PlatformController,
    PlatformRoleGrantController,
    PlatformUserSuspensionController,
    PlatformReportController,
    PlatformContentController,
    PlatformActionLogController
  ],
  exports: [PlatformAccess]
})
export class PlatformModule { }
