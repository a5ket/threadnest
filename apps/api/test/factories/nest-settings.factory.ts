import { NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'
import { NEST_ACCESS_LEVEL } from 'src/nest/constants/nest-access-level'

export type NestSettingsRecord = {
  visibility: NestVisibility
  joinPolicy: NestJoinPolicy
  minThreadCreationLevel: number
  minCommentCreationLevel: number
  minThreadVoteLevel: number
  minCommentVoteLevel: number
  minNestEditLevel: number
  minThreadLockManageLevel: number
  minThreadPinManageLevel: number
  minCommentPinManageLevel: number
  minContentModerateLevel: number
  minMemberViewLevel: number
  minInviteManageLevel: number
  minMemberRemoveLevel: number
  minJoinRequestManageLevel: number
  minBanManageLevel: number
  minActionLogViewLevel: number
}

export const createNestSettings = (
  overrides: Partial<NestSettingsRecord> = {},
): NestSettingsRecord => ({
  visibility: NestVisibility.PUBLIC,
  joinPolicy: NestJoinPolicy.OPEN,
  minThreadCreationLevel: NEST_ACCESS_LEVEL.MEMBER,
  minCommentCreationLevel: NEST_ACCESS_LEVEL.MEMBER,
  minThreadVoteLevel: NEST_ACCESS_LEVEL.MEMBER,
  minCommentVoteLevel: NEST_ACCESS_LEVEL.MEMBER,
  minNestEditLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minThreadLockManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minThreadPinManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minCommentPinManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minContentModerateLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minMemberViewLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minInviteManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minMemberRemoveLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minJoinRequestManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minBanManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
  minActionLogViewLevel: NEST_ACCESS_LEVEL.MODERATOR,
  ...overrides,
})
