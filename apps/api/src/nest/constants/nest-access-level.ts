import { NestMemberRole } from 'generated/prisma/enums'

export const NEST_ACCESS_LEVEL: Record<NestMemberRole, number> = {
  MEMBER: 10,
  MODERATOR: 20,
  OWNER: 30
}

export const ROLE_HIERARCHY = Object.entries(NEST_ACCESS_LEVEL)
  .map(([role, level]) => ({ role: role as NestMemberRole, level }))
  .sort((a, b) => b.level - a.level)