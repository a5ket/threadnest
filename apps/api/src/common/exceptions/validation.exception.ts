import { BadRequestException } from '@nestjs/common'
import { ValidationError } from 'class-validator'
import { CommonErrorCodes } from '../constants/common.error-codes'

type FieldError = {
  field: string
  errors: string[]
}

export class ValidationException extends BadRequestException {
  constructor(validationErrors: ValidationError[] = []) {
    super({
      code: CommonErrorCodes.VALIDATION_FAILED,
      message: 'Validation failed',
      fields: ValidationException.flatten(validationErrors)
    })
  }

  private static flatten(validationErrors: ValidationError[]): FieldError[] {
    return validationErrors.flatMap((error) => {
      const errors = Object.values(error.constraints ?? {})
      const field = { field: error.property, errors }
      const children = error.children?.length ? ValidationException.flatten(error.children) : []

      return errors.length ? [field, ...children] : children
    })
  }
}
