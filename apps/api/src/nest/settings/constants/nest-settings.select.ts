import { Prisma } from 'generated/prisma/client'

export const NEST_SETTINGS_SELECT = {
  visibility: true,
  joinPolicy: true,

  minThreadCreationRole: true,
  minCommentCreationRole: true,

  minNestEditRole: true,

  minThreadLockManageRole: true,
  minThreadPinManageRole: true,
  minCommentPinManageRole: true,

  minContentModerateRole: true,
  minMemberViewRole: true,

  minInviteManageRole: true,
  minMemberRemoveRole: true,
  minJoinRequestManageRole: true,
  minBanManageRole: true
} satisfies Prisma.NestSettingsSelect