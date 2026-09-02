import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'

/**
 * Injects the current user if {@link OptionalAuthGuard} resolved one, otherwise null — for
 * routes that behave differently for guests vs signed-in users without requiring auth.
 *
 * @returns The authenticated user, or null for an anonymous request.
 */
export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | null => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    return request.user ?? null
  }
)
