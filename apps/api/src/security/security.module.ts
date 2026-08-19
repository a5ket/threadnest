import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthGuard } from './guards/auth.guard'
import { OptionalAuthGuard } from './guards/optional-auth.guard'
import { RateLimitGuard } from './guards/rate-limit.guard'
import { VerifiedGuard } from './guards/verified.guard'
import { SecurityConfig } from './security.config'
import { createHybridTracker } from './throttler-tracker'
import { ThrottlerStorageRedisService } from './throttler-storage-redis.service'
import { ThrottlerConfig } from './throttler.config'

@Module({
  imports: [
    JwtModule,
    // 300/min default is deliberately generous — routes needing a tighter limit override it via @RateLimit().
    ThrottlerModule.forRootAsync({
      imports: [JwtModule],
      inject: [ConfigService, JwtService],
      useFactory: (config: ConfigService<ThrottlerConfig & SecurityConfig>, jwt: JwtService) => ({
        throttlers: [{ limit: 300, ttl: 60_000 }],
        storage: new ThrottlerStorageRedisService(config),
        getTracker: createHybridTracker(jwt, config)
      })
    })
  ],
  providers: [
    AuthGuard,
    OptionalAuthGuard,
    VerifiedGuard,
    { provide: APP_GUARD, useClass: RateLimitGuard }
  ],
  exports: [AuthGuard, OptionalAuthGuard, VerifiedGuard, JwtModule]
})
export class SecurityModule { }
