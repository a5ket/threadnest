import { NestJoinRequestRepository } from 'src/nest/join-request/nest-join-request.repository'

export const createMockNestJoinRequestRepository = (): jest.Mocked<Pick<NestJoinRequestRepository, 'existsPending' | 'create' | 'get' | 'getSummary' | 'listAsNest' | 'listAsUser' | 'cancel' | 'approve' | 'reject'>> => ({
  existsPending: jest.fn(),
  create: jest.fn(),
  get: jest.fn(),
  getSummary: jest.fn(),
  listAsNest: jest.fn(),
  listAsUser: jest.fn(),
  cancel: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
})
