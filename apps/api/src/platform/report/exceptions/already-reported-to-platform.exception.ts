import { ConflictException } from '@nestjs/common'
import { PlatformReportErrorCodes } from '../constants/platform-report.error-codes'

export class AlreadyReportedToPlatformException extends ConflictException {
  constructor() {
    super({ code: PlatformReportErrorCodes.ALREADY_REPORTED_TO_PLATFORM, message: 'You already have a pending report for this' })
  }
}
