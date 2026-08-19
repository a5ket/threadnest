import { NestMemberRole } from 'generated/prisma/enums'

export interface ThreadAccessContext {
  role: NestMemberRole | null
  isAuthor: boolean
  isDeleted: boolean
  isLocked: boolean
  isPinned: boolean

  canViewThread: boolean
  canReadContent: boolean
  canEditThread: boolean
  canDeleteThread: boolean
  canCommentThread: boolean
  canVoteThread: boolean
  canSaveThread: boolean
  canVoteComment: boolean
  canModerateContent: boolean
  canManageThreadLock: boolean
  canManageThreadPin: boolean
}
