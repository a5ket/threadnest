import { Injectable } from '@nestjs/common'
import type { UserSuspension } from 'generated/prisma/client'

@Injectable()
export class UserSuspensionPresenter {
  toView(suspension: UserSuspension) {
    return {
      userId: suspension.userId,
      reason: suspension.reason,
      suspendedById: suspension.suspendedById,
      createdAt: suspension.createdAt
    }
  }

  toActiveView(active: { reason: string } | null) {
    return {
      suspended: active !== null,
      reason: active?.reason ?? null
    }
  }
}
