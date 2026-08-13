import { ThreadPolicySubject } from 'src/thread/types/thread.policy-subject'

export const createThreadPolicySubject = (
  overrides: Partial<ThreadPolicySubject> = {},
): ThreadPolicySubject => ({
  id: 'thread-1',
  nestId: 'nest-1',
  authorId: 'author-1',
  slug: 'thread-slug',
  title: 'Thread title',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  deletedAt: null,
  deletedById: null,
  lockedAt: null,
  pinnedAt: null,
  nest: { name: 'Nest', slug: 'nest-slug' },
  ...overrides,
})
