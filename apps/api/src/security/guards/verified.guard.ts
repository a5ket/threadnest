import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { EmailVerificationRequiredException } from 'src/common/exceptions/email-verification-required.exception'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.user?.emailVerified) {
      throw new EmailVerificationRequiredException()
    }

    return true
  }
}
