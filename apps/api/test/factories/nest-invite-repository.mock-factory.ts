import { NestInviteRepository } from 'src/nest/invite/nest-invite.repository'

export const createMockNestInviteRepository = (): jest.Mocked<Pick<NestInviteRepository, 'existsPending' | 'create' | 'listAsNest' | 'listAsUser' | 'getSummary' | 'findSummary' | 'accept' | 'decline' | 'revoke'>> => ({
  existsPending: jest.fn(),
  create: jest.fn(),
  listAsNest: jest.fn(),
  listAsUser: jest.fn(),
  getSummary: jest.fn(),
  findSummary: jest.fn(),
  accept: jest.fn(),
  decline: jest.fn(),
  revoke: jest.fn(),
})
