import { CommentPresenter } from 'src/comment/comment.presenter'

export const createMockCommentPresenter = (): jest.Mocked<Pick<CommentPresenter, 'toView' | 'toTreePage' | 'toAuthorItemView'>> => ({
  toView: jest.fn(),
  toTreePage: jest.fn(),
  toAuthorItemView: jest.fn(),
})
