import { Injectable } from '@nestjs/common'
import { PlatformReportStatus } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { PlatformAccess } from '../platform.access'
import { PlatformReportAlreadyResolvedException } from './exceptions/platform-report-already-resolved.exception'
import type { PlatformReportPolicySubject } from './types/platform-report.policy-subject'

@Injectable()
export class PlatformReportPolicy {
  constructor(private readonly platformAccess: PlatformAccess) { }

  async assertIsModerator(actorUserId: string) {
    const ctx = await this.platformAccess.getContext(actorUserId)

    if (!ctx.isModerator) {
      throw new InsufficientPermissionsException()
    }
  }

  assertCanReview(report: PlatformReportPolicySubject) {
    if (report.status !== PlatformReportStatus.PENDING) {
      throw new PlatformReportAlreadyResolvedException()
    }
  }
}
