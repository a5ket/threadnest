import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { EmailVerificationRequiredException } from 'src/common/exceptions/email-verification-required.exception'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'

/**
 * Gates a route behind email verification. Reads `request.user`, so it must run after
 * {@link AuthGuard} — apply via {@link Verified} or {@link AuthenticatedAndVerified}, not on its own.
 */
@Injectable()
export class VerifiedGuard implements CanActivate {
  /**
   * @param context - The execution context; only the underlying HTTP request is used.
   * @returns true if the user's email is verified.
   * @throws {EmailVerificationRequiredException} No user on the request, or unverified.
   */
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.user?.emailVerified) {
      throw new EmailVerificationRequiredException()
    }

    return true
  }
}
