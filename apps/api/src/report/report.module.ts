import { Module } from '@nestjs/common'
import { CommentModule } from 'src/comment/comment.module'
import { NestModule } from 'src/nest/nest.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { ThreadModule } from 'src/thread/thread.module'
import { UserModule } from 'src/user/user.module'
import { CommentReportController } from './comment-report.controller'
import { NestReportController } from './nest-report.controller'
import { NestThreadReportController } from './nest-thread-report.controller'
import { ReportPolicy } from './report.policy'
import { ReportPresenter } from './report.presenter'
import { ReportRepository } from './report.repository'
import { ReportService } from './report.service'

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    NestModule,
    ThreadModule,
    CommentModule,
    UserModule
  ],
  controllers: [
    NestReportController,
    NestThreadReportController,
    CommentReportController
  ],
  providers: [
    ReportRepository,
    ReportPolicy,
    ReportPresenter,
    ReportService
  ]
})
export class ReportModule { }
