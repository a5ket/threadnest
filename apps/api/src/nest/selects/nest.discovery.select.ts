import { Prisma } from 'generated/prisma/client'
import { NestJoinRequestStatus } from 'generated/prisma/enums'

// '' is a sentinel for anonymous viewers so an omitted filter can't match another user's rows.
export function nestDiscoverySelect(viewerId?: string) {
  return {
    id: true,
    name: true,
    slug: true,
    description: true,
    iconKey: true,
    memberCount: true,
    threadCount: true,
    createdAt: true,
    updatedAt: true,
    nestSettings: { select: { visibility: true, joinPolicy: true } },
    members: { where: { userId: viewerId ?? '' }, select: { userId: true }, take: 1 },
    nestJoinRequests: { where: { userId: viewerId ?? '', status: NestJoinRequestStatus.PENDING }, select: { id: true }, take: 1 }
  } satisfies Prisma.NestSelect
}
