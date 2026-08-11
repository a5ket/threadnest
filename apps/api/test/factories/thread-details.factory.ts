import { ThreadDetails } from 'src/thread/types/thread.details'

export const createThreadDetails = (
  overrides: Partial<ThreadDetails> = {},
): ThreadDetails => ({
  id: 'thread-1',
  nestId: 'nest-1',
  authorId: 'author-1',
  title: 'Thread title',
  slug: 'thread-slug',
  content: 'Thread content',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
  deletedById: null,
  lockedAt: null,
  pinnedAt: null,
  commentCount: 0,
  lastCommentAt: null,
  score: 0,
  author: { id: 'author-1', profile: null, nestMembership: [] },
  viewerVote: null,
  ...overrides,
})
