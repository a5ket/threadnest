export interface ThreadAccessContext {
  isAuthor: boolean
  isDeleted: boolean
  isLocked: boolean
  isPinned: boolean

  canViewThread: boolean
  canReadContent: boolean
  canEditThread: boolean
  canDeleteThread: boolean
  canCommentThread: boolean
  canModerateContent: boolean
  canManageThreadLock: boolean
  canManageThreadPin: boolean
}