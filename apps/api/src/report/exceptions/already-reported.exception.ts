import { ConflictException } from '@nestjs/common'
import { ReportErrorCodes } from '../constants/report.error-codes'

export class AlreadyReportedException extends ConflictException {
  constructor() {
    super({ code: ReportErrorCodes.ALREADY_REPORTED, message: 'You already have a pending report for this content' })
  }
}
