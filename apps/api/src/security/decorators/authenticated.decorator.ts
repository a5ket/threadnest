import { applyDecorators, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { InvalidAccessTokenException } from 'src/auth/exceptions/invalid-access-token.exception'
import { MissingAccessTokenException } from 'src/auth/exceptions/missing-access-token.exception'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'

export const Authenticated = () => applyDecorators(
  UseGuards(AuthGuard),
  ApiBearerAuth(),
  ApiExceptionResponses(MissingAccessTokenException, InvalidAccessTokenException)
)
