import { MODERATION_GRACE_PERIOD_MS } from 'src/common/constants/moderation.constants'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createThreadPolicySubject } from 'test/factories/thread-policy-subject.factory'
import { ThreadAccess } from './thread.access'

describe('ThreadAccess', () => {
  const nestAccess = createMockNestAccess()
  const threadAccess = new ThreadAccess(nestAccess as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('allows reading content when the thread is not deleted', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canModerateContent: false }))
    const thread = createThreadPolicySubject({ deletedAt: null })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canReadContent).toBe(true)
  })

  it('hides content from everyone, including moderators, when the author deleted it themselves', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canModerateContent: true }))
    const thread = createThreadPolicySubject({ authorId: 'author-1', deletedAt: new Date(), deletedById: 'author-1' })

    const ctx = await threadAccess.getContext(thread, 'moderator-1')

    expect(ctx.canReadContent).toBe(false)
  })

  it('lets a moderator read moderator-removed content within the grace period', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canModerateContent: true }))
    const thread = createThreadPolicySubject({
      authorId: 'author-1',
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'moderator-1',
    })

    const ctx = await threadAccess.getContext(thread, 'moderator-1')

    expect(ctx.canReadContent).toBe(true)
  })

  it('hides moderator-removed content from a non-moderator, even within the grace period', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canModerateContent: false }))
    const thread = createThreadPolicySubject({
      authorId: 'author-1',
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'moderator-1',
    })

    const ctx = await threadAccess.getContext(thread, 'member-1')

    expect(ctx.canReadContent).toBe(false)
  })

  it('hides moderator-removed content from moderators once the grace period has passed', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canModerateContent: true }))
    const thread = createThreadPolicySubject({
      authorId: 'author-1',
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS - 1000),
      deletedById: 'moderator-1',
    })

    const ctx = await threadAccess.getContext(thread, 'moderator-1')

    expect(ctx.canReadContent).toBe(false)
  })

  it('allows voting on a viewable, non-deleted thread', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true }))
    const thread = createThreadPolicySubject({ deletedAt: null })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canVoteThread).toBe(true)
  })

  it('blocks voting on a deleted thread', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true }))
    const thread = createThreadPolicySubject({ deletedAt: new Date() })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canVoteThread).toBe(false)
  })

  it('allows voting on a locked thread — locking blocks new comments, not votes', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canCreateComment: true }))
    const thread = createThreadPolicySubject({ deletedAt: null, lockedAt: new Date() })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canCommentThread).toBe(false)
    expect(ctx.canVoteThread).toBe(true)
  })

  it('blocks voting on the thread when the nest\'s minThreadVoteLevel isn\'t met', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canVoteThread: false }))
    const thread = createThreadPolicySubject({ deletedAt: null })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canVoteThread).toBe(false)
  })

  it('blocks voting on comments when the nest\'s minCommentVoteLevel isn\'t met', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canVoteComment: false }))
    const thread = createThreadPolicySubject({ deletedAt: null })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canVoteComment).toBe(false)
  })

  it('blocks voting on comments when the thread is deleted, even if the nest allows it', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canVoteComment: true }))
    const thread = createThreadPolicySubject({ deletedAt: new Date() })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canVoteComment).toBe(false)
  })

  it('allows saving a viewable, non-deleted thread', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true }))
    const thread = createThreadPolicySubject({ deletedAt: null })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canSaveThread).toBe(true)
  })

  it('blocks saving a deleted thread', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true }))
    const thread = createThreadPolicySubject({ deletedAt: new Date() })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canSaveThread).toBe(false)
  })

  it('allows saving even when the nest\'s minThreadVoteLevel isn\'t met — saving is a personal bookmark, not a nest interaction', async () => {
    nestAccess.getContext.mockResolvedValue(createNestAccessContext({ canViewNest: true, canVoteThread: false }))
    const thread = createThreadPolicySubject({ deletedAt: null })

    const ctx = await threadAccess.getContext(thread, 'user-1')

    expect(ctx.canSaveThread).toBe(true)
  })
})
