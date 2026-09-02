import { Module } from '@nestjs/common'
import { AttachmentModule } from 'src/attachment/attachment.module'
import { CommentModule } from 'src/comment/comment.module'
import { NestModule as ThreadNestModule } from 'src/nest/nest.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { ThreadModule } from 'src/thread/thread.module'
import { UserModule } from 'src/user/user.module'
import { DemoSeedCommand } from './demo-seed.command'
import { SeedCommand } from './seed.command'

@Module({
  imports: [PrismaModule, UserModule, ThreadNestModule, ThreadModule, CommentModule, AttachmentModule],
  providers: [SeedCommand, DemoSeedCommand]
})
export class SeedModule { }
