import { Injectable } from '@nestjs/common'
import { PlatformReportStatus } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { PlatformAccess } from '../platform.access'
import { PlatformReportAlreadyResolvedException } from './exceptions/platform-report-already-resolved.exception'
import type { PlatformReportPolicySubject } from './types/platform-report.policy-subject'

@Injectable()
export class PlatformReportPolicy {
  constructor(private readonly platformAccess: PlatformAccess) { }

  /**
   * @param actorUserId - The user attempting a platform report-queue action.
   * @throws {InsufficientPermissionsException} Not a platform moderator or admin.
   */
  async assertIsModerator(actorUserId: string) {
    const ctx = await this.platformAccess.getContext(actorUserId)

    if (!ctx.isModerator) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @param report - The report to check.
   * @throws {PlatformReportAlreadyResolvedException} Already resolved or dismissed.
   */
  assertCanReview(report: PlatformReportPolicySubject) {
    if (report.status !== PlatformReportStatus.PENDING) {
      throw new PlatformReportAlreadyResolvedException()
    }
  }
}
