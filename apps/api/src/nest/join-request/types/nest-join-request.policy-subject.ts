import { NestJoinRequestStatus } from 'generated/prisma/enums'

export type NestJoinRequestPolicySubject = {
  nestId: string
  userId: string
  status: NestJoinRequestStatus
}