import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/prisma/prisma.module'
import { UserModule } from 'src/user/user.module'
import { NotificationPresenter } from './notification.presenter'
import { NotificationRepository } from './notification.repository'
import { NotificationService } from './notification.service'
import { CommentCreatedNotificationSubscriber } from './subscribers/comment-created.subscriber'
import { InviteSentNotificationSubscriber } from './subscribers/invite-sent.subscriber'
import { JoinRequestApprovedNotificationSubscriber } from './subscribers/join-request-approved.subscriber'
import { JoinRequestRejectedNotificationSubscriber } from './subscribers/join-request-rejected.subscriber'
import { OwnershipTransferredNotificationSubscriber } from './subscribers/ownership-transferred.subscriber'
import { ReportResolvedNotificationSubscriber } from './subscribers/report-resolved.subscriber'
import { UserBannedNotificationSubscriber } from './subscribers/user-banned.subscriber'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [
    NotificationRepository,
    NotificationPresenter,
    NotificationService,
    CommentCreatedNotificationSubscriber,
    JoinRequestApprovedNotificationSubscriber,
    JoinRequestRejectedNotificationSubscriber,
    InviteSentNotificationSubscriber,
    UserBannedNotificationSubscriber,
    OwnershipTransferredNotificationSubscriber,
    ReportResolvedNotificationSubscriber
  ],
  exports: [NotificationService]
})
export class NotificationModule { }
