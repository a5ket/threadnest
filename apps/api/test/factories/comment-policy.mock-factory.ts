import { CommentPolicy } from 'src/comment/comment.policy'

export const createMockCommentPolicy = (): jest.Mocked<Pick<CommentPolicy, 'assertCanCreateThreadComment' | 'assertCanReadThreadComment' | 'assertCanUpdateComment' | 'assertCanDeleteComment' | 'assertCanReplyToComment' | 'assertCanVoteOnComment'>> => ({
  assertCanCreateThreadComment: jest.fn(),
  assertCanReadThreadComment: jest.fn(),
  assertCanUpdateComment: jest.fn(),
  assertCanDeleteComment: jest.fn(),
  assertCanReplyToComment: jest.fn(),
  assertCanVoteOnComment: jest.fn(),
})
