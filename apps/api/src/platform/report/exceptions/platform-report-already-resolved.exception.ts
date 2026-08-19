import { ConflictException } from '@nestjs/common'
import { PlatformReportErrorCodes } from '../constants/platform-report.error-codes'

export class PlatformReportAlreadyResolvedException extends ConflictException {
  constructor() {
    super({ code: PlatformReportErrorCodes.PLATFORM_REPORT_ALREADY_RESOLVED, message: 'This report has already been resolved' })
  }
}
