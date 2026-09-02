import { Prisma } from 'generated/prisma/client'
import { NestJoinRequestStatus } from 'generated/prisma/enums'
import { NEST_JOIN_REQUEST_SELECT } from 'src/nest/join-request/selects/nest-join-request.select'
import { NEST_JOIN_REQUEST_SUMMARY_SELECT } from 'src/nest/join-request/selects/nest-join-request.summary.select'

type NestJoinRequestSummary = Prisma.NestJoinRequestGetPayload<{ select: typeof NEST_JOIN_REQUEST_SUMMARY_SELECT }>
type NestJoinRequestFlat = Prisma.NestJoinRequestGetPayload<{ select: typeof NEST_JOIN_REQUEST_SELECT }>

export const createNestJoinRequestSummary = (overrides: Partial<NestJoinRequestSummary> = {}): NestJoinRequestSummary => ({
  id: 'request-1',
  message: null,
  status: NestJoinRequestStatus.PENDING,
  resolvedAt: null,
  createdAt: new Date('2024-01-01'),
  nest: { id: 'nest-1', slug: 'nest-slug', name: 'Nest', iconKey: null },
  user: { id: 'user-1', profile: { username: 'user-1', displayName: null, avatarKey: null } },
  resolvedBy: null,
  ...overrides,
})

export const createNestJoinRequestFlat = (overrides: Partial<NestJoinRequestFlat> = {}): NestJoinRequestFlat => ({
  id: 'request-1',
  nestId: 'nest-1',
  userId: 'user-1',
  status: NestJoinRequestStatus.PENDING,
  resolvedAt: null,
  resolvedById: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
})
