import { NestMemberRole } from 'generated/prisma/enums'
import { NestAccess } from 'src/nest/nest.access'
import { NEST_ACCESS_LEVEL } from 'src/nest/constants/nest-access-level'

export const createMockNestAccess = (): jest.Mocked<Pick<NestAccess, 'getContext' | 'isHigherRole' | 'isSameOrHigherRole' | 'isSameOrLowerRole' | 'isLowerRole'>> => ({
  getContext: jest.fn(),
  isHigherRole: jest.fn((actor: NestMemberRole, target: NestMemberRole) =>
    NEST_ACCESS_LEVEL[actor] > NEST_ACCESS_LEVEL[target]
  ),
  isSameOrHigherRole: jest.fn((actor: NestMemberRole, target: NestMemberRole) =>
    NEST_ACCESS_LEVEL[actor] >= NEST_ACCESS_LEVEL[target]
  ),
  isSameOrLowerRole: jest.fn((actor: NestMemberRole, target: NestMemberRole) =>
    NEST_ACCESS_LEVEL[actor] <= NEST_ACCESS_LEVEL[target]
  ),
  isLowerRole: jest.fn((actor: NestMemberRole, target: NestMemberRole) =>
    NEST_ACCESS_LEVEL[actor] < NEST_ACCESS_LEVEL[target]
  ),
})
