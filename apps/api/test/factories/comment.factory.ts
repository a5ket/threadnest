import { Comment } from 'src/comment/types/comment'

export const createComment = (
  overrides: Partial<Comment> = {},
): Comment => ({
  id: 'comment-1',
  threadId: 'thread-1',
  authorId: 'author-1',
  parentId: null,
  content: 'hello',
  depth: 0,
  replyCount: 0,
  score: 0,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  editedAt: null,
  deletedAt: null,
  deletedById: null,
  author: { id: 'author-1', profile: null },
  ...overrides,
})
