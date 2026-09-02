import { CommentService } from 'src/comment/comment.service'

export const createMockCommentService = (): jest.Mocked<Pick<CommentService, 'removeByPlatform' | 'removeAllByAuthorPlatform' | 'listByAuthor'>> => ({
  removeByPlatform: jest.fn(),
  removeAllByAuthorPlatform: jest.fn(),
  listByAuthor: jest.fn(),
})
