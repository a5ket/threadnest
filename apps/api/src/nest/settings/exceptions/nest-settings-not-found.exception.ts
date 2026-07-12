import { NotFoundException } from '@nestjs/common'
import { NestsSettingsErrorCodes } from '../constants/nest-settings.error-codes'

export class NestSettingsNotFoundException extends NotFoundException {
  constructor() {
    super({ code: NestsSettingsErrorCodes.SETTINGS_NOT_FOUND, message: 'Nest settings not found' })
  }
}
