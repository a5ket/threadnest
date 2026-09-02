import { Injectable } from '@nestjs/common'
import type { UserSuspension } from 'generated/prisma/client'

@Injectable()
export class UserSuspensionPresenter {
  /**
   * Full record view, for platform-admin listing.
   *
   * @param suspension - The suspension record to present.
   */
  toView(suspension: UserSuspension) {
    return {
      userId: suspension.userId,
      reason: suspension.reason,
      suspendedById: suspension.suspendedById,
      createdAt: suspension.createdAt
    }
  }

  /**
   * Minimal status view for a user checking their own account — no `suspendedById`/timestamps,
   * just whether they're blocked and why.
   *
   * @param active - The user's active suspension, or null if not suspended.
   */
  toActiveView(active: { reason: string } | null) {
    return {
      suspended: active !== null,
      reason: active?.reason ?? null
    }
  }
}
