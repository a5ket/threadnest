import { NestPolicy } from 'src/nest/nest.policy'

export const createMockNestPolicy = (): jest.Mocked<Pick<NestPolicy, 'assertCanCreateNest' | 'assertCanViewNestByAccessContext' | 'assertCanUpdateNest' | 'assertCanDeleteNest' | 'assertCanTransferOwnership'>> => ({
  assertCanCreateNest: jest.fn(),
  assertCanViewNestByAccessContext: jest.fn(),
  assertCanUpdateNest: jest.fn(),
  assertCanDeleteNest: jest.fn(),
  assertCanTransferOwnership: jest.fn(),
})
