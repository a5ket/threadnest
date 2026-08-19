import { NotFoundException } from '@nestjs/common'
import { PlatformReportErrorCodes } from '../constants/platform-report.error-codes'

export class PlatformReportNotFoundException extends NotFoundException {
  constructor() {
    super({ code: PlatformReportErrorCodes.PLATFORM_REPORT_NOT_FOUND, message: 'Report not found' })
  }
}
