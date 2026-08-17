import { NestActionLogRepository } from 'src/nest/action-log/nest-action-log.repository'

export const createMockNestActionLogRepository = (): jest.Mocked<Pick<NestActionLogRepository,
  'create' | 'listByNest'
>> => ({
  create: jest.fn(),
  listByNest: jest.fn(),
})
