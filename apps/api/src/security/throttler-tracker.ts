import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { ThrottlerGetTrackerFunction } from '@nestjs/throttler'
import { AccessTokenPayload } from 'src/common/types/access.token.payload'
import { extractAccessToken } from './access-token.util'
import { SecurityConfig } from './security.config'

// Falling back to IP is still safe on /auth/*: an attacker can never hold the victim's token.
type TrackedRequest = { headers: { authorization?: string, cookie?: string }, ip: string }

export function createHybridTracker(jwt: JwtService, config: ConfigService<SecurityConfig>): ThrottlerGetTrackerFunction {
  return async (rawReq) => {
    const req = rawReq as TrackedRequest
    const token = extractAccessToken(req)

    if (token) {
      try {
        const payload = await jwt.verifyAsync<AccessTokenPayload>(token, {
          secret: config.getOrThrow('jwtAccessSecret', { infer: true })
        })

        return `user:${payload.sub}`
      } catch {
        // invalid/expired token — fall through to IP
      }
    }

    return `ip:${req.ip}`
  }
}
