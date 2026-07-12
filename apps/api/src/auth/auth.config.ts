export interface AuthConfig {
  jwtAccessSecret: string
  jwtRefreshSecret: string
  jwtAccessExpiresIn: string
  jwtRefreshExpiresIn: string
  refreshTokenLifetimeDays: number
}

