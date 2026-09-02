import { Injectable } from '@nestjs/common'
import { StorageService } from 'src/storage/storage.service'
import { ROLE_HIERARCHY } from './constants/nest-access-level'
import { NestAccessContext } from './types/nest.access-context'
import { NestDiscovery } from './types/nest.discovery'
import { NestSummary } from './types/nest.summary'

@Injectable()
export class NestPresenter {
  constructor(private readonly storage: StorageService) { }

  private resolveIconUrl(iconKey: string | null) {
    return iconKey ? this.storage.getPublicUrl(iconKey) : null
  }

  toDiscoveryView(nest: NestDiscovery) {
    return {
      id: nest.id,
      name: nest.name,
      slug: nest.slug,
      description: nest.description,
      iconUrl: this.resolveIconUrl(nest.iconKey),
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
      iconUrl: this.resolveIconUrl(nest.iconKey),
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
      isDeleted: Boolean(nest.deletedAt),
      ...(access.canViewNestMetadata && {
        description: nest.description,
        iconUrl: this.resolveIconUrl(nest.iconKey),
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

  toReferenceView(nest: { name: string; slug: string; iconKey: string | null }) {
    return {
      name: nest.name,
      slug: nest.slug,
      iconUrl: this.resolveIconUrl(nest.iconKey),
    }
  }
}
