import { applyDecorators, UseGuards } from '@nestjs/common'
import { EmailVerificationRequiredException } from 'src/common/exceptions/email-verification-required.exception'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { VerifiedGuard } from '../guards/verified.guard'

export const Verified = () => applyDecorators(
  UseGuards(VerifiedGuard),
  ApiExceptionResponses(EmailVerificationRequiredException)
)
