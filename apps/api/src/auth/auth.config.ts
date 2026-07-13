export interface AuthConfig {
  jwtAccessSecret: string
  jwtAccessExpiresIn: string
  jwtRefreshExpiresIn: string
  refreshTokenLifetimeDays: number
}

