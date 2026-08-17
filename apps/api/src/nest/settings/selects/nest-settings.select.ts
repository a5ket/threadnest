import { Prisma } from 'generated/prisma/client'

export const NEST_SETTINGS_SELECT = {
  visibility: true,
  joinPolicy: true,

  minThreadCreationLevel: true,
  minCommentCreationLevel: true,

  minThreadVoteLevel: true,
  minCommentVoteLevel: true,

  minNestEditLevel: true,

  minThreadLockManageLevel: true,
  minThreadPinManageLevel: true,
  minCommentPinManageLevel: true,

  minContentModerateLevel: true,
  minMemberViewLevel: true,

  minInviteManageLevel: true,
  minMemberRemoveLevel: true,
  minJoinRequestManageLevel: true,
  minBanManageLevel: true,
  minActionLogViewLevel: true
} satisfies Prisma.NestSettingsSelect
