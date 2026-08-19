import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InvalidAccessTokenException } from 'src/auth/exceptions/invalid-access-token.exception'
import { MissingAccessTokenException } from 'src/auth/exceptions/missing-access-token.exception'
import { AccessTokenPayload } from 'src/common/types/access.token.payload'
import { AuthenticatedRequest } from 'src/common/types/authenticated.request'
import { extractAccessToken } from '../access-token.util'
import { SecurityConfig } from '../security.config'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<SecurityConfig>,
  ) { }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = extractAccessToken(request)

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
}