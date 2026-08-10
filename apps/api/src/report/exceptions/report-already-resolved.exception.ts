import { ConflictException } from '@nestjs/common'
import { ReportErrorCodes } from '../constants/report.error-codes'

export class ReportAlreadyResolvedException extends ConflictException {
  constructor() {
    super({ code: ReportErrorCodes.REPORT_ALREADY_RESOLVED, message: 'This report has already been resolved' })
  }
}
