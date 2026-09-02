import { NestInvitePresenter } from 'src/nest/invite/nest-invite.presenter'

export const createMockNestInvitePresenter = (): jest.Mocked<Pick<NestInvitePresenter, 'toNestView' | 'toUserView'>> => ({
  toNestView: jest.fn(),
  toUserView: jest.fn(),
})
