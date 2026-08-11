import { Prisma } from 'generated/prisma/client'
import { NEST_SUMMARY_SELECT } from 'src/nest/selects/nest.summary.select'

type NestSummary = Prisma.NestGetPayload<{ select: typeof NEST_SUMMARY_SELECT }>

export const createNestSummary = (
  overrides: Partial<NestSummary> = {},
): NestSummary => ({
  id: 'nest-1',
  name: 'Nest',
  slug: 'nest-slug',
  description: null,
  memberCount: 1,
  threadCount: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
})
