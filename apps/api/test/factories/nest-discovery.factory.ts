import { NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'
import { NestDiscovery } from 'src/nest/types/nest.discovery'

export const createNestDiscovery = (
  overrides: Partial<NestDiscovery> = {},
): NestDiscovery => ({
  id: 'nest-1',
  name: 'Nest',
  slug: 'nest-slug',
  description: null,
  iconKey: null,
  memberCount: 1,
  threadCount: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  visibility: NestVisibility.PUBLIC,
  joinPolicy: NestJoinPolicy.OPEN,
  isMember: false,
  hasPendingJoinRequest: false,
  ...overrides,
})
