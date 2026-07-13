import { CommentPolicySubject } from 'src/comment/types/comment.policy-subject'

export const createCommentPolicySubject = (
  overrides: Partial<CommentPolicySubject> = {},
): CommentPolicySubject => ({
  id: 'comment-1',
  threadId: 'thread-1',
  authorId: 'author-1',
  deletedAt: null,
  deletedById: null,
  ...overrides,
})
