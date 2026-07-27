import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InvalidAccessTokenException } from 'src/auth/exceptions/invalid-access-token.exception'
import { MissingAccessTokenException } from 'src/auth/exceptions/missing-access-token.exception'
import { ACCESS_TOKEN_COOKIE } from 'src/common/constants/auth-cookie.constants'
import { AccessTokenPayload } from 'src/common/types/access.token.payload'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'
import { SecurityConfig } from '../security.config'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<SecurityConfig>,
  ) { }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractAccessToken(request)

    if (!token) {
      throw new MissingAccessTokenException()
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

      return true
    } catch {
      throw new InvalidAccessTokenException()
    }
  }

  private extractAccessToken(request: AuthenticatedRequest) {
    const header = request.headers.authorization

    if (header?.startsWith('Bearer ')) {
      return header.slice('Bearer '.length)
    }

    return this.getCookie(request.headers.cookie, ACCESS_TOKEN_COOKIE)
  }

  private getCookie(cookieHeader: string | undefined, name: string) {
    const value = cookieHeader
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.slice(name.length + 1)

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