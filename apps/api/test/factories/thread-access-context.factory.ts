import { ThreadAccessContext } from 'src/thread/types/thread.access-context'

export const createThreadAccessContext = (
  overrides: Partial<ThreadAccessContext> = {},
): ThreadAccessContext => ({
  role: null,
  isAuthor: false,
  isDeleted: false,
  isLocked: false,
  isPinned: false,

  canViewThread: true,
  canReadContent: true,
  canEditThread: false,
  canDeleteThread: false,
  canCommentThread: true,
  canModerateContent: false,
  canManageThreadLock: false,
  canManageThreadPin: false,

  ...overrides,
})
