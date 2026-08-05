import { Injectable } from '@nestjs/common'
import { NestAccessContext } from './types/nest.access-context'
import { NestSummary } from './types/nest.summary'

@Injectable()
export class NestPresenter {
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
    }
  }

  toReferenceView(nest: { name: string; slug: string }) {
    return {
      name: nest.name,
      slug: nest.slug,
    }
  }
}
