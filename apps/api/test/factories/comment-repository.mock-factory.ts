import { CommentRepository } from 'src/comment/comment.repository'

export const createMockCommentRepository = (): jest.Mocked<Pick<CommentRepository, 'getById' | 'getByIdForViewer' | 'getByThread' | 'getReplies' | 'create' | 'createReply' | 'updateById' | 'softDeleteById' | 'listByAuthor' | 'listActiveByAuthor' | 'softDeleteManyByAuthor' | 'getLatestCommentByThreadId' | 'decrementReplyCount' | 'adjustScore'>> => ({
  getById: jest.fn(),
  getByIdForViewer: jest.fn(),
  getByThread: jest.fn(),
  getReplies: jest.fn(),
  create: jest.fn(),
  createReply: jest.fn(),
  updateById: jest.fn(),
  softDeleteById: jest.fn(),
  listByAuthor: jest.fn(),
  listActiveByAuthor: jest.fn(),
  softDeleteManyByAuthor: jest.fn(),
  getLatestCommentByThreadId: jest.fn(),
  decrementReplyCount: jest.fn(),
  adjustScore: jest.fn(),
})
