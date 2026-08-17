import { NestJoinPolicy, NestMemberRole, NestVisibility } from 'generated/prisma/enums'

export interface NestAccessContext {
  isMember: boolean
  role: NestMemberRole | null
  level: number
  isBanned: boolean,
  isOwner: boolean

  visibility: NestVisibility
  joinPolicy: NestJoinPolicy

  canViewNest: boolean

  canCreateThread: boolean
  canCreateComment: boolean

  canVoteThread: boolean
  canVoteComment: boolean

  canEditNest: boolean

  canManageThreadLock: boolean
  canManageThreadPin: boolean
  canManageCommentPin: boolean

  canModerateContent: boolean

  canViewMembers: boolean
  canManageInvites: boolean
  canRemoveMembers: boolean
  canManageJoinRequests: boolean
  canManageBans: boolean
  canViewActionLog: boolean

  canManageSettings: boolean,
  canDeleteNest: boolean,
  canTransferOwnership: boolean,
  canManageMemberRoles: boolean,

  canLeaveNest: boolean
}