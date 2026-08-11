import { CommentRepository } from 'src/comment/comment.repository'

export const createMockCommentRepository = (): jest.Mocked<Pick<CommentRepository, 'getById'>> => ({
  getById: jest.fn(),
})
