import { CommentWithRole } from 'src/comment/types/comment'

// Typed as the richer CommentWithRole (viewer-select) shape — a strict superset of the plain
// Comment (COMMENT_SELECT) shape, so this fixture satisfies call sites expecting either.
export const createComment = (
  overrides: Partial<CommentWithRole> = {},
): CommentWithRole => ({
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
  deletedByPlatform: false,
  attachments: [],
  author: { id: 'author-1', profile: null, nestMembership: [] },
  viewerVote: null,
  ...overrides,
})
