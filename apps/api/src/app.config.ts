import { AuthConfig } from './auth/auth.config'
import { CacheConfig } from './cache/cache.config'
import { EmailConfig } from './email/email.config'
import { EventConfig } from './event/event.config'
import { QueueConfig } from './queue/queue.config'
import { SecurityConfig } from './security/security.config'
import { ThrottlerConfig } from './security/throttler.config'
import { UrlConfig } from './url/url.config'

export type AppConfig =
  AuthConfig &
  CacheConfig &
  SecurityConfig &
  ThrottlerConfig &
  QueueConfig &
  EventConfig &
  UrlConfig &
  EmailConfig &
  {
    port: number
    databaseUrl: string
  }

export default (): AppConfig => {
  const auth: AuthConfig = {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtAccessExpiresIn: '15m',
    jwtRefreshExpiresIn: '30d',
    refreshTokenLifetimeDays: 30
  }

  const security: SecurityConfig = {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!
  }

  const cache: CacheConfig = {
    redisHost: process.env.REDIS_HOST!,
    redisPort: parseInt(process.env.REDIS_PORT!),
    cacheKeyPrefix: 'threadnest:'
  }

  const throttler: ThrottlerConfig = {
    redisHost: process.env.REDIS_HOST!,
    redisPort: parseInt(process.env.REDIS_PORT!),
    throttlerKeyPrefix: 'threadnest:throttle:'
  }

  const queue: QueueConfig = {
    redisHost: process.env.REDIS_HOST!,
    redisPort: parseInt(process.env.REDIS_PORT!)
  }

  const event: EventConfig = {
    redisHost: process.env.REDIS_HOST!,
    redisPort: parseInt(process.env.REDIS_PORT!)
  }

  const url: UrlConfig = {
    webAppUrl: process.env.WEB_APP_URL!
  }

  const email: EmailConfig = {
    smtpHost: process.env.SMTP_HOST!,
    smtpPort: parseInt(process.env.SMTP_PORT!),
    smtpUser: process.env.SMTP_USER!,
    smtpPass: process.env.SMTP_PASS!,
    emailFrom: process.env.EMAIL_FROM!
  }

  return {
    port: parseInt(process.env.PORT!),
    databaseUrl: process.env.DATABASE_URL!,
    ...auth,
    ...security,
    ...cache,
    ...throttler,
    ...queue,
    ...event,
    ...url,
    ...email
  }
}