import { Prisma } from 'generated/prisma/client'

export const NEST_REFERENCE_SELECT = {
  id: true,
  name: true,
  slug: true
} satisfies Prisma.NestSelect