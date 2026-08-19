import { NotFoundException } from '@nestjs/common'
import { PlatformReportErrorCodes } from '../constants/platform-report.error-codes'

export class PlatformReportTargetNotFoundException extends NotFoundException {
  constructor() {
    super({ code: PlatformReportErrorCodes.PLATFORM_REPORT_TARGET_NOT_FOUND, message: 'The content or user being reported could not be found' })
  }
}
