import { Injectable } from '@nestjs/common'
import { StorageService } from 'src/storage/storage.service'
import { ROLE_HIERARCHY } from './constants/nest-access-level'
import { NestAccessContext } from './types/nest.access-context'
import { NestDiscovery } from './types/nest.discovery'
import { NestSummary } from './types/nest.summary'

/** Shapes nest views for discovery listings and the nest detail page. */
@Injectable()
export class NestPresenter {
  constructor(private readonly storage: StorageService) { }

  private resolveIconUrl(iconKey: string | null) {
    return iconKey ? this.storage.getPublicUrl(iconKey) : null
  }

  /**
   * Row shape for search/discovery listings — includes the viewer-specific `isMember` /
   * `hasPendingJoinRequest` flags.
   *
   * @param nest - The nest to present.
   */
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

  /**
   * Compact shape for embedding a nest inside another response (e.g. a thread's parent nest).
   *
   * @param nest - The nest to present.
   */
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

  /**
   * The nest detail page's data. Metadata (description, icon, counts, timestamps) is included
   * only if `access.canViewNestMetadata` — see {@link NestAccess.getContext} for what that
   * excludes for a paywalled nest the viewer hasn't subscribed to. The role hierarchy is included
   * only for moderators, who need it to reason about role-based permissions.
   *
   * @param nest - The nest to present.
   * @param access - The viewer's permission context.
   */
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

  /**
   * Minimal shape for referencing a nest by name (e.g. in a search result's parent-nest field).
   *
   * @param nest - The nest fields needed to render a reference.
   */
  toReferenceView(nest: { name: string; slug: string; iconKey: string | null }) {
    return {
      name: nest.name,
      slug: nest.slug,
      iconUrl: this.resolveIconUrl(nest.iconKey),
    }
  }
}
