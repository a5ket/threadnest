import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import configuration from './app.config'
import { AppController } from './app.controller'
import { AttachmentModule } from './attachment/attachment.module'
import { AuthModule } from './auth/auth.module'
import { BlockModule } from './block/block.module'
import { CacheModule } from './cache/cache.module'
import { ChatModule } from './chat/chat.module'
import { CommentModule } from './comment/comment.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { EmailModule } from './email/email.module'
import { EventModule } from './event/event.module'
import { LoggerModule } from './logger/logger.module'
import { MeModule } from './me/me.module'
import { NestModule } from './nest/nest.module'
import { NotificationModule } from './notification/notification.module'
import { PlatformModule } from './platform/platform.module'
import { PrismaModule } from './prisma/prisma.module'
import { QueueModule } from './queue/queue.module'
import { RealtimeModule } from './realtime/realtime.module'
import { ReportModule } from './report/report.module'
import { SecurityModule } from './security/security.module'
import { SeedModule } from './seed/seed.module'
import { StorageModule } from './storage/storage.module'
import { ThreadModule } from './thread/thread.module'
import { UserActivityModule } from './user-activity/user-activity.module'
import { UserModule } from './user/user.module'

@Module({
  controllers: [
    AppController
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter }
  ],
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    CacheModule,
    PrismaModule,
    SecurityModule,
    AuthModule,
    UserModule,
    NestModule,
    MeModule,
    ThreadModule,
    EventModule,
    CommentModule,
    BlockModule,
    QueueModule,
    EmailModule,
    ReportModule,
    NotificationModule,
    PlatformModule,
    ChatModule,
    StorageModule,
    AttachmentModule,
    RealtimeModule,
    UserActivityModule,
    SeedModule
  ]
})
export class AppModule { }
