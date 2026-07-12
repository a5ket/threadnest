import { NestInviteStatus } from 'generated/prisma/enums'

export type NestInvitePolicySubject = {
  nestId: string
  userId: string
  status: NestInviteStatus
}