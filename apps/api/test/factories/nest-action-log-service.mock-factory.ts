import { NestActionLogService } from 'src/nest/action-log/nest-action-log.service'

export const createMockNestActionLogService = (): jest.Mocked<Pick<NestActionLogService, 'create'>> => ({
  create: jest.fn(),
})
