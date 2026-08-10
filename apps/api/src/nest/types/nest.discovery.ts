import { NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'
import { Prisma } from 'generated/prisma/client'
import { nestDiscoverySelect } from '../selects/nest.discovery.select'

export type NestDiscoveryRaw = Prisma.NestGetPayload<{ select: ReturnType<typeof nestDiscoverySelect> }>

export type NestDiscovery = Omit<NestDiscoveryRaw, 'nestSettings' | 'members' | 'nestJoinRequests'> & {
  visibility: NestVisibility
  joinPolicy: NestJoinPolicy
  isMember: boolean
  hasPendingJoinRequest: boolean
}
