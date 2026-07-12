import { AuthConfig } from './auth/auth.config'
import { EmailConfig } from './email/email.config'
import { QueueConfig } from './queue/queue.config'
import { SecurityConfig } from './security/security.config'
import { UrlConfig } from './url/url.config'

export type AppConfig =
  AuthConfig &
  SecurityConfig &
  QueueConfig &
  UrlConfig &
  EmailConfig &
  {
    port: number
  }

const auth: AuthConfig = {
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtAccessExpiresIn: '15m',
  jwtRefreshExpiresIn: '30d',
  refreshTokenLifetimeDays: 30
}

const security: SecurityConfig = {
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!
}

const queue: QueueConfig = {
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

export default (): AppConfig => ({
  port: parseInt(process.env.PORT!),
  ...auth,
  ...security,
  ...queue,
  ...url,
  ...email
})