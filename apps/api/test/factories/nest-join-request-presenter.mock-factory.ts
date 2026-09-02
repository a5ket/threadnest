import { NestJoinRequestPresenter } from 'src/nest/join-request/nest-join-request.presenter'

export const createMockNestJoinRequestPresenter = (): jest.Mocked<Pick<NestJoinRequestPresenter, 'toUserView' | 'toNestView'>> => ({
  toUserView: jest.fn(),
  toNestView: jest.fn(),
})
