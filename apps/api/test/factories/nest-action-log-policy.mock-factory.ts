import { NestActionLogPolicy } from 'src/nest/action-log/nest-action-log.policy'

export const createMockNestActionLogPolicy = (): jest.Mocked<Pick<NestActionLogPolicy, 'assertCanViewActionLog'>> => ({
  assertCanViewActionLog: jest.fn(),
})
