import { Injectable } from '@nestjs/common'
import { ReportStatus } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from 'src/nest/nest.access'
import { ReportAlreadyResolvedException } from './exceptions/report-already-resolved.exception'
import type { ReportPolicySubject } from './types/report.policy-subject'

@Injectable()
export class ReportPolicy {
  constructor(private readonly nestAccess: NestAccess) { }

  async assertCanListQueue(nestId: string, actorUserId: string) {
    await this.assertCanModerateContent(nestId, actorUserId)
  }

  async assertCanReview(report: ReportPolicySubject, nestId: string, actorUserId: string) {
    await this.assertCanModerateContent(nestId, actorUserId)

    if (report.status !== ReportStatus.PENDING) {
      throw new ReportAlreadyResolvedException()
    }
  }

  private async assertCanModerateContent(nestId: string, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nestId, actorUserId)

    if (!ctx.canModerateContent) {
      throw new InsufficientPermissionsException()
    }
  }
}
