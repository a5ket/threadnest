import { NestMemberPresenter } from 'src/nest/member/nest-member.presenter'

export const createMockNestMemberPresenter = (): jest.Mocked<Pick<NestMemberPresenter, 'toView'>> => ({
  toView: jest.fn(),
})
