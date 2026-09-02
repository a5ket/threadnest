import { Injectable } from '@nestjs/common'
import type { PlatformRoleGrant } from 'generated/prisma/client'
import { PlatformRole } from 'generated/prisma/enums'

/** Shapes platform role grants into API responses. */
@Injectable()
export class PlatformRoleGrantPresenter {
  /**
   * @param grant - The grant to present.
   * @returns The grant's view.
   */
  toView(grant: PlatformRoleGrant) {
    return {
      userId: grant.userId,
      role: grant.role,
      grantedById: grant.grantedById,
      createdAt: grant.createdAt
    }
  }

  /**
   * @param role - The user's active role, or `null` if they have none.
   * @returns A minimal view wrapping just the role.
   */
  toActiveRoleView(role: PlatformRole | null) {
    return { role }
  }
}
