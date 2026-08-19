import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AccessTokenPayload } from 'src/common/types/access.token.payload'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'
import { extractAccessToken } from '../access-token.util'
import { SecurityConfig } from '../security.config'

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<SecurityConfig>,
  ) { }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = extractAccessToken(request)

    if (!token) {
      return true
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow('jwtAccessSecret', { infer: true })
      })

      request.user = {
        id: payload.sub,
        email: payload.email,
        sid: payload.sid,
        emailVerified: payload.emailVerified
      }
    } catch {
      // invalid token — proceed without user
    }

    return true
  }
}
