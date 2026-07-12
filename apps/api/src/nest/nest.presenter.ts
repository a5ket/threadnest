import { Injectable } from '@nestjs/common'
import { NestAccessContext } from './types/nest.access-context'
import { NestSummary } from './types/nest.summary'

@Injectable()
export class NestPresenter {
  toSummaryView(nest: NestSummary) {
    return {
      id: nest.id,
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
      id: nest.id,
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
    }
  }
}