import { Module } from '@nestjs/common'
import { CommentModule } from 'src/comment/comment.module'
import { ThreadModule } from 'src/thread/thread.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { UserModule } from 'src/user/user.module'
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
  imports: [PrismaModule, SecurityModule, UserModule, ThreadModule, CommentModule],
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
    GrantAdminCommand
  ],
  controllers: [PlatformController, PlatformRoleGrantController, PlatformUserSuspensionController, PlatformReportController, PlatformContentController],
  exports: [PlatformAccess]
})
export class PlatformModule { }
