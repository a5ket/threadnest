import { NestMemberRole } from 'generated/prisma/enums'

export const NEST_ACCESS_LEVEL: Record<NestMemberRole, number> = {
  MEMBER: 10,
  MODERATOR: 20,
  OWNER: 30
}