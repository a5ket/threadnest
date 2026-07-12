import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'

export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | null => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    return request.user ?? null
  }
)
