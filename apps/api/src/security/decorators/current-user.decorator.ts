import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.user) {
      throw new Error('CurrentUser used without AuthGuard')
    }

    return request.user
  }
)