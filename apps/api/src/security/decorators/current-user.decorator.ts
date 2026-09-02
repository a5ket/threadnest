import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'

/**
 * Injects the authenticated user attached by {@link AuthGuard}.
 *
 * @throws {Error} Used on a route without {@link AuthGuard} — pair it with {@link Authenticated}.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.user) {
      throw new Error('CurrentUser used without AuthGuard')
    }

    return request.user
  }
)