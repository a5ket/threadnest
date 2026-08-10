import { NotFoundException } from '@nestjs/common'
import { ReportErrorCodes } from '../constants/report.error-codes'

export class ReportNotFoundException extends NotFoundException {
  constructor() {
    super({ code: ReportErrorCodes.REPORT_NOT_FOUND, message: 'Report not found' })
  }
}
