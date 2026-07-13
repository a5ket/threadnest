import { NestInviteRepository } from 'src/nest/invite/nest-invite.repository'

export const createMockNestInviteRepository = (): jest.Mocked<Pick<NestInviteRepository, 'existsPending'>> => ({
  existsPending: jest.fn(),
})
