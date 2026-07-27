import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { ACCESS_TOKEN_COOKIE } from 'src/common/constants/auth-cookie.constants'
import { AccessTokenPayload } from 'src/common/types/access.token.payload'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'
import { SecurityConfig } from '../security.config'

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<SecurityConfig>,
  ) { }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractAccessToken(request)

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

  private extractAccessToken(request: AuthenticatedRequest) {
    const header = request.headers.authorization

    if (header?.startsWith('Bearer ')) {
      return header.slice('Bearer '.length)
    }

    const value = request.headers.cookie
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
      ?.slice(ACCESS_TOKEN_COOKIE.length + 1)

    if (!value) {
      return null
    }

    try {
      return decodeURIComponent(value)
    } catch {
      return null
    }
  }
}
