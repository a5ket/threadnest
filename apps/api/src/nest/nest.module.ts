import { Module } from '@nestjs/common'
import { BillingModule } from 'src/billing/billing.module'
import { EventModule } from 'src/event/event.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { UrlModule } from 'src/url/url.module'
import { UserModule } from 'src/user/user.module'
import { NestActionLogController } from './action-log/nest-action-log.controller'
import { NestActionLogPolicy } from './action-log/nest-action-log.policy'
import { NestActionLogPresenter } from './action-log/nest-action-log.presenter'
import { NestActionLogRepository } from './action-log/nest-action-log.repository'
import { NestActionLogService } from './action-log/nest-action-log.service'
import { CommentRemovedActionLogSubscriber } from './action-log/subscribers/comment-removed.subscriber'
import { JoinRequestApprovedActionLogSubscriber } from './action-log/subscribers/join-request-approved.subscriber'
import { JoinRequestRejectedActionLogSubscriber } from './action-log/subscribers/join-request-rejected.subscriber'
import { MemberRemovedActionLogSubscriber } from './action-log/subscribers/member-removed.subscriber'
import { MemberRoleChangedActionLogSubscriber } from './action-log/subscribers/member-role-changed.subscriber'
import { OwnershipTransferredActionLogSubscriber } from './action-log/subscribers/ownership-transferred.subscriber'
import { ReportResolvedActionLogSubscriber } from './action-log/subscribers/report-resolved.subscriber'
import { SettingsUpdatedActionLogSubscriber } from './action-log/subscribers/settings-updated.subscriber'
import { ThreadRemovedActionLogSubscriber } from './action-log/subscribers/thread-removed.subscriber'
import { UserBannedActionLogSubscriber } from './action-log/subscribers/user-banned.subscriber'
import { UserUnbannedActionLogSubscriber } from './action-log/subscribers/user-unbanned.subscriber'
import { NestBanController } from './ban/nest-ban.controller'
import { NestBanPolicy } from './ban/nest-ban.policy'
import { NestBanPresenter } from './ban/nest-ban.presenter'
import { NestBanRepository } from './ban/nest-ban.repository'
import { NestBanPrismaRepository } from './ban/nest-ban.prisma.repository'
import { NestBanCachedRepository } from './ban/nest-ban.cached.repository'
import { NestBanService } from './ban/nest-ban.service'
import { NestInviteCollectionController } from './invite/nest-invite.controller'
import { NestInvitePolicy } from './invite/nest-invite.policy'
import { NestInvitePresenter } from './invite/nest-invite.presenter'
import { NestInviteRepository } from './invite/nest-invite.repository'
import { NestInviteService } from './invite/nest-invite.service'
import { NestLedgerEntryRepository } from './ledger/nest-ledger-entry.repository'
import { NestLedgerService } from './ledger/nest-ledger.service'
import { NestJoinRequestCollectionController } from './join-request/nest-join-request.controller'
import { NestJoinRequestPolicy } from './join-request/nest-join-request.policy'
import { NestJoinRequestPresenter } from './join-request/nest-join-request.presenter'
import { NestJoinRequestRepository } from './join-request/nest-join-request.repository'
import { NestJoinRequestService } from './join-request/nest-join-request.service'
import { NestMemberController } from './member/nest-member.controller'
import { NestMemberPolicy } from './member/nest-member.policy'
import { NestMemberPresenter } from './member/nest-member.presenter'
import { NestMemberRepository } from './member/nest-member.repository'
import { NestMemberPrismaRepository } from './member/nest-member.prisma.repository'
import { NestMemberCachedRepository } from './member/nest-member.cached.repository'
import { NestMemberService } from './member/nest-member.service'
import { NestSlugController } from './nest-slug.controller'
import { NestAccess } from './nest.access'
import { NestController } from './nest.controller'
import { NestPolicy } from './nest.policy'
import { NestPresenter } from './nest.presenter'
import { NestRepository } from './nest.repository'
import { NestPrismaRepository } from './nest.prisma.repository'
import { NestCachedRepository } from './nest.cached.repository'
import { NestService } from './nest.service'
import { NestPaywallController } from './paywall/nest-paywall.controller'
import { NestPaywallPolicy } from './paywall/nest-paywall.policy'
import { NestPaywallRepository } from './paywall/nest-paywall.repository'
import { NestPaywallService } from './paywall/nest-paywall.service'
import { NestPayoutController } from './payout/nest-payout.controller'
import { NestPayoutPolicy } from './payout/nest-payout.policy'
import { NestPayoutAccountRepository } from './payout/nest-payout-account.repository'
import { NestPayoutService } from './payout/nest-payout.service'
import { UserNestPreferencePolicy } from './preferences/user-nest-preference.policy'
import { UserNestPreferenceRepository } from './preferences/user-nest-preference.repository'
import { UserNestPreferenceService } from './preferences/user-nest-preference.service'
import { NestSettingsController } from './settings/nest-settings.controller'
import { NestSettingsPolicy } from './settings/nest-settings.policy'
import { NestSettingsRepository } from './settings/nest-settings.repository'
import { NestSettingsPrismaRepository } from './settings/nest-settings.prisma.repository'
import { NestSettingsCachedRepository } from './settings/nest-settings.cached.repository'
import { NestSettingsService } from './settings/nest-settings.service'
import { NestSubscriptionController } from './subscription/nest-subscription.controller'
import { NestSubscriptionRepository } from './subscription/nest-subscription.repository'
import { NestSubscriptionService } from './subscription/nest-subscription.service'
import { NestDeletedSubscriptionSubscriber } from './subscription/subscribers/nest-deleted.subscriber'
import { StripeWebhookController } from './subscription/webhook/stripe-webhook.controller'
import { StripeWebhookService } from './subscription/webhook/stripe-webhook.service'

@Module({
  imports: [
    PrismaModule,
    EventModule,
    SecurityModule,
    UserModule,
    BillingModule,
    UrlModule
  ],
  controllers: [
    NestController,
    NestSlugController,
    NestMemberController,
    NestBanController,
    NestInviteCollectionController,
    NestJoinRequestCollectionController,
    NestSettingsController,
    NestActionLogController,
    NestPaywallController,
    NestSubscriptionController,
    NestPayoutController,
    StripeWebhookController
  ],
  providers: [
    NestPrismaRepository,
    { provide: NestRepository, useClass: NestCachedRepository },
    NestMemberPrismaRepository,
    { provide: NestMemberRepository, useClass: NestMemberCachedRepository },
    NestBanPrismaRepository,
    { provide: NestBanRepository, useClass: NestBanCachedRepository },
    NestInviteRepository,
    NestJoinRequestRepository,
    NestSettingsPrismaRepository,
    { provide: NestSettingsRepository, useClass: NestSettingsCachedRepository },
    UserNestPreferenceRepository,
    NestActionLogRepository,
    NestService,
    UserNestPreferenceService,
    NestMemberService,
    NestBanService,
    NestInviteService,
    NestJoinRequestService,
    NestSettingsService,
    NestActionLogService,
    NestSubscriptionRepository,
    NestSubscriptionService,
    NestPaywallRepository,
    NestPaywallService,
    NestLedgerEntryRepository,
    NestLedgerService,
    NestPayoutAccountRepository,
    NestPayoutService,
    StripeWebhookService,
    NestMemberPolicy,
    NestBanPolicy,
    NestInvitePolicy,
    NestJoinRequestPolicy,
    NestSettingsPolicy,
    NestActionLogPolicy,
    NestPaywallPolicy,
    NestPayoutPolicy,
    UserNestPreferencePolicy,
    NestInvitePresenter,
    NestJoinRequestPresenter,
    NestBanPresenter,
    NestMemberPresenter,
    NestActionLogPresenter,
    NestAccess,
    NestPresenter,
    NestPolicy,
    MemberRoleChangedActionLogSubscriber,
    UserBannedActionLogSubscriber,
    UserUnbannedActionLogSubscriber,
    MemberRemovedActionLogSubscriber,
    JoinRequestApprovedActionLogSubscriber,
    JoinRequestRejectedActionLogSubscriber,
    ThreadRemovedActionLogSubscriber,
    CommentRemovedActionLogSubscriber,
    ReportResolvedActionLogSubscriber,
    OwnershipTransferredActionLogSubscriber,
    SettingsUpdatedActionLogSubscriber,
    NestDeletedSubscriptionSubscriber
  ],
  exports: [
    NestRepository,
    NestMemberRepository,
    NestService,
    NestMemberService,
    NestInviteService,
    NestJoinRequestService,
    UserNestPreferenceService,
    NestAccess
  ]
})
export class NestModule { }
