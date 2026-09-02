import { applyDecorators, UseGuards } from '@nestjs/common'
import { EmailVerificationRequiredException } from 'src/common/exceptions/email-verification-required.exception'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { VerifiedGuard } from '../guards/verified.guard'

/** Requires the current user's email to be verified — assumes {@link Authenticated} already ran. */
export const Verified = () => applyDecorators(
  UseGuards(VerifiedGuard),
  ApiExceptionResponses(EmailVerificationRequiredException)
)
