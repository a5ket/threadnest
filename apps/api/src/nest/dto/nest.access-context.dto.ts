import { ApiProperty } from '@nestjs/swagger'
import { NestJoinPolicy, NestMemberRole, NestVisibility } from 'generated/prisma/enums'

export class NestAccessContextDto {
  @ApiProperty({ description: 'Whether the current user is a member of the nest' })
  isMember!: boolean

  @ApiProperty({ description: 'The current user\'s role in the nest', enum: NestMemberRole, nullable: true })
  role!: NestMemberRole | null

  @ApiProperty({ description: 'The current user\'s permission level — 0 if they aren\'t a member. See the nest\'s roles list for what a level unlocks' })
  level!: number

  @ApiProperty({ description: 'Whether the current user is banned from the nest' })
  isBanned!: boolean

  @ApiProperty({ description: 'Whether the current user owns the nest' })
  isOwner!: boolean

  @ApiProperty({ description: 'Nest visibility', enum: NestVisibility })
  visibility!: NestVisibility

  @ApiProperty({ description: 'Nest join policy', enum: NestJoinPolicy })
  joinPolicy!: NestJoinPolicy

  @ApiProperty({ description: 'Whether the nest requires a subscription to view' })
  isPaywalled!: boolean

  @ApiProperty({ description: 'Subscription price in cents, if the nest is paywalled', nullable: true })
  paywallPriceAmountCents!: number | null

  @ApiProperty({ description: 'Whether the current user has an active subscription to this nest' })
  hasActiveSubscription!: boolean

  @ApiProperty({ description: 'Whether the current user can view the nest' })
  canViewNest!: boolean

  @ApiProperty({ description: 'Whether the current user can view the nest\'s basic info (description, member/thread counts) even if they can\'t view its content' })
  canViewNestMetadata!: boolean

  @ApiProperty({ description: 'Whether the current user can create a thread' })
  canCreateThread!: boolean

  @ApiProperty({ description: 'Whether the current user can create a comment' })
  canCreateComment!: boolean

  @ApiProperty({ description: 'Whether the current user can edit the nest' })
  canEditNest!: boolean

  @ApiProperty({ description: 'Whether the current user can manage thread locking' })
  canManageThreadLock!: boolean

  @ApiProperty({ description: 'Whether the current user can manage thread pinning' })
  canManageThreadPin!: boolean

  @ApiProperty({ description: 'Whether the current user can manage comment pinning' })
  canManageCommentPin!: boolean

  @ApiProperty({ description: 'Whether the current user can moderate content' })
  canModerateContent!: boolean

  @ApiProperty({ description: 'Whether the current user can view the member list' })
  canViewMembers!: boolean

  @ApiProperty({ description: 'Whether the current user can manage invites' })
  canManageInvites!: boolean

  @ApiProperty({ description: 'Whether the current user can remove members' })
  canRemoveMembers!: boolean

  @ApiProperty({ description: 'Whether the current user can manage join requests' })
  canManageJoinRequests!: boolean

  @ApiProperty({ description: 'Whether the current user can manage bans' })
  canManageBans!: boolean

  @ApiProperty({ description: 'Whether the current user can view the nest action log' })
  canViewActionLog!: boolean

  @ApiProperty({ description: 'Whether the current user can manage nest settings' })
  canManageSettings!: boolean

  @ApiProperty({ description: 'Whether the current user can delete the nest' })
  canDeleteNest!: boolean

  @ApiProperty({ description: 'Whether the current user can transfer nest ownership' })
  canTransferOwnership!: boolean

  @ApiProperty({ description: 'Whether the current user can manage member roles' })
  canManageMemberRoles!: boolean

  @ApiProperty({ description: 'Whether the current user can leave the nest' })
  canLeaveNest!: boolean
}
