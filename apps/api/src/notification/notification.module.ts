import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/prisma/prisma.module'
import { NotificationPresenter } from './notification.presenter'
import { NotificationRepository } from './notification.repository'
import { NotificationService } from './notification.service'

@Module({
  imports: [PrismaModule],
  providers: [NotificationRepository, NotificationPresenter, NotificationService],
  exports: [NotificationService]
})
export class NotificationModule { }
