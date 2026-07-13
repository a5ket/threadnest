import {
  NestJoinPolicy,
  NestMemberRole,
  NestVisibility,
} from 'generated/prisma/enums'
import { NestAccessContext } from 'src/nest/types/nest.access-context'

export const createNestAccessContext = (
  overrides: Partial<NestAccessContext> = {},
): NestAccessContext => ({
  isMember: true,
  role: NestMemberRole.MEMBER,
  isBanned: false,
  isOwner: false,

  visibility: NestVisibility.PUBLIC,
  joinPolicy: NestJoinPolicy.OPEN,

  canViewNest: true,

  canCreateThread: true,
  canCreateComment: true,

  canEditNest: false,

  canManageThreadLock: false,
  canManageThreadPin: false,
  canManageCommentPin: false,

  canModerateContent: false,

  canViewMembers: true,
  canManageInvites: false,
  canRemoveMembers: false,
  canManageJoinRequests: false,
  canManageBans: false,

  canManageSettings: false,
  canDeleteNest: false,
  canTransferOwnership: false,
  canManageMemberRoles: false,

  canLeaveNest: true,

  ...overrides,
})