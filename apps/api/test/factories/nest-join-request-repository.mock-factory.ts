import { NestJoinRequestRepository } from 'src/nest/join-request/nest-join-request.repository'

export const createMockNestJoinRequestRepository = (): jest.Mocked<Pick<NestJoinRequestRepository, 'existsPending'>> => ({
  existsPending: jest.fn(),
})
