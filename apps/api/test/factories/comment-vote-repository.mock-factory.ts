import { CommentVoteRepository } from 'src/comment/comment-vote.repository'

export const createMockCommentVoteRepository = (): jest.Mocked<Pick<CommentVoteRepository, 'find' | 'upsert' | 'delete'>> => ({
  find: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
})
