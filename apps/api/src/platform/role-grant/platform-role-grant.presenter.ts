import { Injectable } from '@nestjs/common'
import type { PlatformRoleGrant } from 'generated/prisma/client'
import { PlatformRole } from 'generated/prisma/enums'

@Injectable()
export class PlatformRoleGrantPresenter {
  toView(grant: PlatformRoleGrant) {
    return {
      userId: grant.userId,
      role: grant.role,
      grantedById: grant.grantedById,
      createdAt: grant.createdAt
    }
  }

  toActiveRoleView(role: PlatformRole | null) {
    return { role }
  }
}
