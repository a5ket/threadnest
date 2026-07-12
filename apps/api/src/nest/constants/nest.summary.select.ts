import { Prisma } from 'generated/prisma/client'

export const NEST_SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  memberCount: true,
  threadCount: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.NestSelect