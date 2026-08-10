import { Injectable } from '@nestjs/common'
import { ROLE_HIERARCHY } from './constants/nest-access-level'
import { NestAccessContext } from './types/nest.access-context'
import { NestDiscovery } from './types/nest.discovery'
import { NestSummary } from './types/nest.summary'

@Injectable()
export class NestPresenter {
  toDiscoveryView(nest: NestDiscovery) {
    return {
      id: nest.id,
      name: nest.name,
      slug: nest.slug,
      description: nest.description,
      memberCount: nest.memberCount,
      threadCount: nest.threadCount,
      createdAt: nest.createdAt,
      updatedAt: nest.updatedAt,
      visibility: nest.visibility,
      joinPolicy: nest.joinPolicy,
      isMember: nest.isMember,
      hasPendingJoinRequest: nest.hasPendingJoinRequest,
    }
  }

  toSummaryView(nest: NestSummary) {
    return {
      name: nest.name,
      slug: nest.slug,
      description: nest.description,
      memberCount: nest.memberCount,
      threadCount: nest.threadCount,
      createdAt: nest.createdAt,
      updatedAt: nest.updatedAt,
    }
  }

  toDetailView(nest: NestSummary, access: NestAccessContext) {
    return {
      name: nest.name,
      slug: nest.slug,
      access,
      ...(access.canViewNest && {
        description: nest.description,
        memberCount: nest.memberCount,
        threadCount: nest.threadCount,
        createdAt: nest.createdAt,
        updatedAt: nest.updatedAt,
      }),
      ...(access.canModerateContent && {
        roles: ROLE_HIERARCHY,
      }),
    }
  }

  toReferenceView(nest: { name: string; slug: string }) {
    return {
      name: nest.name,
      slug: nest.slug,
    }
  }
}
