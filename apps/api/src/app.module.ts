import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from './app.config'
import { AuthModule } from './auth/auth.module'
import { BlockModule } from './block/block.module'
import { CommentModule } from './comment/comment.module'
import { EventModule } from './event/event.module'
import { MeModule } from './me/me.module'
import { NestModule } from './nest/nest.module'
import { PrismaModule } from './prisma/prisma.module'
import { SecurityModule } from './security/security.module'
import { ThreadModule } from './thread/thread.module'
import { UserModule } from './user/user.module'
import { QueueModule } from './queue/queue.module'
import { EmailModule } from './email/email.module'

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      load: [configuration]
    }),
    SecurityModule,
    UserModule,
    NestModule,
    MeModule,
    ThreadModule,
    EventModule,
    CommentModule,
    BlockModule,
    QueueModule,
    EmailModule
  ]
})
export class AppModule { }
