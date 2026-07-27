import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { CacheService } from 'src/cache/cache.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { EventBus } from 'src/event/event-bus'
import { UserService } from 'src/user/user.service'
import { AuthConfig } from './auth.config'
import { LoginDto } from './dto/auth.login.dto'
import { RegisterDto } from './dto/auth.register.dto'
import { EmailChangedEvent } from './events/email-changed.event'
import { EmailChangeRequestedEvent } from './events/email-change-requested.event'
import { EmailVerificationRequestedEvent } from './events/email-verification-requested.event'
import { EmailVerifiedEvent } from './events/email-verified.event'
import { PasswordResetEvent } from './events/password-reset.event'
import { PasswordResetRequestedEvent } from './events/password-reset-requested.event'
import { SessionRefreshedEvent } from './events/session-refreshed.event'
import { UserLoggedInEvent } from './events/user-logged-in.event'
import { UserLoggedOutEvent } from './events/user-logged-out.event'
import { UserRegisteredEvent } from './events/user-registered.event'
import { UserSessionsRevokedEvent } from './events/user-sessions-revoked.event'
import { EmailTakenException } from './exceptions/email-taken.exception'
import { InvalidCredentialsException } from './exceptions/invalid-credentials.exception'
import { InvalidRefreshTokenException } from './exceptions/invalid-refresh-token.exception'
import { RefreshTokenExpiredException } from './exceptions/refresh-token-expired.exception'
import { TokenNotFoundException } from './exceptions/token-not-found.exception'
import { TokenSupersededException } from './exceptions/token-superseded.exception'
import { TokenAlreadyRedeemedException } from './exceptions/token-already-redeemed.exception'
import { TokenExpiredException } from './exceptions/token-expired.exception'
import { SamePasswordException } from './exceptions/same-password.exception'
import { EmailService } from 'src/email/email.service'
import { RefreshTokenRepository } from './refresh-token.repository'
import { ConfirmationTokenStatus, ConfirmationTokenType } from 'generated/prisma/enums'
import { ConfirmationTokenRepository } from './confirmation-token.repository'

type RefreshResult = {
  accessToken: string
  refreshToken: string
}

const REFRESH_RESULT_TTL_MS = 15_000
const REFRESH_RESULT_WAIT_MS = 2_000
const REFRESH_RESULT_POLL_INTERVAL_MS = 50

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly confirmationTokenRepo: ConfirmationTokenRepository,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AuthConfig>,
    private readonly cache: CacheService,
    private readonly eventBus: EventBus,
    private readonly emailService: EmailService
  ) { }

  async register(dto: RegisterDto) {
    const exists = await this.userService.existsByEmail(dto.email)

    if (exists) {
      throw new EmailTakenException()
    }

    const passwordHash = await this.hashPassword(dto.password)
    const user = await this.userService.create(dto.email, passwordHash)
    const tokens = await this.createSession(user.id, user.email, false)

    void this.eventBus.publish(new UserRegisteredEvent({ userId: user.id, email: user.email }))
    void this.requestEmailVerification(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.profile?.username ?? '',
        avatarUrl: user.profile?.avatarUrl ?? null,
        createdAt: user.createdAt
      },
      ...tokens
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmailWithCredentials(dto.email)

    if (!user?.passwordHash) {
      throw new InvalidCredentialsException()
    }

    const isPasswordValid = await this.verifyPassword(user.passwordHash, dto.password)

    if (!isPasswordValid) {
      throw new InvalidCredentialsException()
    }

    const tokens = await this.createSession(user.id, user.email, user.emailVerifiedAt !== null)

    void this.eventBus.publish(new UserLoggedInEvent({ userId: user.id, email: user.email }))

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.profile?.username ?? '',
        avatarUrl: user.profile?.avatarUrl ?? null,
        createdAt: user.createdAt
      },
      ...tokens
    }
  }

  async logoutCurrentSession(userId: string, sessionId: string) {
    await this.refreshTokenRepo.revokeOne(sessionId, userId)

    void this.eventBus.publish(new UserLoggedOutEvent({ userId, sessionId }))

    return { success: true }
  }

  async logoutAllSessions(userId: string) {
    await this.refreshTokenRepo.revokeAll(userId)

    void this.eventBus.publish(new UserSessionsRevokedEvent({ userId }))

    return { success: true }
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken)
    const cached = await this.getCachedRefreshResult(tokenHash)

    if (cached) {
      return cached
    }

    const currentSession = await this.refreshTokenRepo.findByHash(tokenHash)

    if (!currentSession) {
      throw new InvalidRefreshTokenException()
    }

    if (currentSession.revokedAt) {
      const withinGracePeriod = Date.now() - currentSession.revokedAt.getTime() <= REFRESH_RESULT_TTL_MS
      const result = withinGracePeriod ? await this.waitForRefreshResult(tokenHash) : null

      if (result) {
        return result
      }

      throw new InvalidRefreshTokenException()
    }

    if (currentSession.expiresAt < new Date()) {
      throw new RefreshTokenExpiredException()
    }

    const newRefreshToken = this.generateRefreshToken()
    const newSession = await this.refreshTokenRepo.rotate(
      currentSession.id,
      currentSession.userId,
      this.hashToken(newRefreshToken),
      currentSession.familyId,
      this.addDays(this.config.getOrThrow('refreshTokenLifetimeDays'))
    )

    if (!newSession) {
      const result = await this.waitForRefreshResult(tokenHash)

      if (result) {
        return result
      }

      throw new InvalidRefreshTokenException()
    }

    const accessToken = await this.createAccessToken(
      currentSession.user.id,
      currentSession.user.email,
      newSession.id,
      currentSession.user.emailVerifiedAt !== null
    )
    const result = { accessToken, refreshToken: newRefreshToken }

    await this.cache.set(this.refreshResultKey(tokenHash), result, REFRESH_RESULT_TTL_MS)

    void this.eventBus.publish(new SessionRefreshedEvent({ userId: currentSession.user.id, sessionId: newSession.id }))

    return result
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userService.getByIdWithCredentials(userId)

    if (!user?.passwordHash || !(await this.verifyPassword(user.passwordHash, currentPassword))) {
      throw new InvalidCredentialsException()
    }

    if (await this.verifyPassword(user.passwordHash, newPassword)) {
      throw new SamePasswordException()
    }

    const passwordHash = await this.hashPassword(newPassword)
    await this.userService.updatePassword(userId, passwordHash)
  }

  async requestEmailVerification(userId: string) {
    const user = await this.userService.findByIdWithEmail(userId)
    const token = await this.createToken(userId, ConfirmationTokenType.EMAIL_VERIFICATION, this.addDays(1))

    void this.eventBus.publish(new EmailVerificationRequestedEvent({ userId, email: user.email }))
    void this.emailService.sendVerificationEmail(user.email, token)

    return token
  }

  async confirmEmailVerification(rawToken: string) {
    const token = await this.getToken(rawToken, ConfirmationTokenType.EMAIL_VERIFICATION)

    await this.prisma.$transaction(async (tx) => {
      await this.confirmationTokenRepo.redeem(token.id, tx)
      await this.userService.markEmailVerified(token.userId, tx)
    })

    void this.eventBus.publish(new EmailVerifiedEvent({ userId: token.userId }))
  }

  async requestPasswordReset(email: string) {
    const user = await this.userService.findByEmailWithCredentials(email)

    if (!user) {
      return
    }

    const token = await this.createToken(user.id, ConfirmationTokenType.PASSWORD_RESET, this.addMinutes(15))

    void this.eventBus.publish(new PasswordResetRequestedEvent({ userId: user.id, email: user.email }))
    void this.emailService.sendPasswordResetEmail(user.email, token)
  }

  async validatePasswordResetToken(rawToken: string) {
    await this.getToken(rawToken, ConfirmationTokenType.PASSWORD_RESET)
  }

  async confirmPasswordReset(rawToken: string, password: string) {
    const token = await this.getToken(rawToken, ConfirmationTokenType.PASSWORD_RESET)

    const user = await this.userService.getByIdWithCredentials(token.userId)

    if (user?.passwordHash && await this.verifyPassword(user.passwordHash, password)) {
      throw new SamePasswordException()
    }

    const passwordHash = await this.hashPassword(password)

    await this.prisma.$transaction(async (tx) => {
      await this.confirmationTokenRepo.redeem(token.id, tx)
      await this.userService.updatePassword(token.userId, passwordHash, tx)
    })

    await this.refreshTokenRepo.revokeAll(token.userId)

    void this.eventBus.publish(new PasswordResetEvent({ userId: token.userId }))
  }

  async requestEmailChange(userId: string, newEmail: string) {
    const user = await this.userService.findByIdWithEmail(userId)

    if (user.email === newEmail) {
      throw new EmailTakenException()
    }

    const exists = await this.userService.existsByEmail(newEmail)

    if (exists) {
      throw new EmailTakenException()
    }

    const token = await this.createToken(userId, ConfirmationTokenType.EMAIL_CHANGE, this.addMinutes(30), newEmail)

    void this.eventBus.publish(new EmailChangeRequestedEvent({ userId, newEmail }))
    void this.emailService.sendEmailChangeEmail(newEmail, token, newEmail)
  }

  async confirmEmailChange(rawToken: string) {
    const token = await this.getToken(rawToken, ConfirmationTokenType.EMAIL_CHANGE)

    if (!token.targetEmail) {
      throw new TokenNotFoundException()
    }

    await this.prisma.$transaction(async (tx) => {
      await this.confirmationTokenRepo.redeem(token.id, tx)
      await this.userService.updateEmail(token.userId, token.targetEmail!, tx)
    })

    void this.eventBus.publish(new EmailChangedEvent({ userId: token.userId, newEmail: token.targetEmail }))
  }

  private async createSession(userId: string, email: string, emailVerified: boolean) {
    const refreshToken = this.generateRefreshToken()

    const session = await this.refreshTokenRepo.create(
      userId,
      this.hashToken(refreshToken),
      randomUUID(),
      this.addDays(this.config.getOrThrow('refreshTokenLifetimeDays'))
    )

    const accessToken = await this.createAccessToken(userId, email, session.id, emailVerified)

    return { accessToken, refreshToken }
  }

  private createAccessToken(userId: string, email: string, sessionId: string, emailVerified: boolean) {
    return this.jwt.signAsync(
      { sub: userId, email, sid: sessionId, emailVerified },
      {
        secret: this.config.getOrThrow('jwtAccessSecret', { infer: true }),
        expiresIn: this.config.getOrThrow('jwtAccessExpiresIn', { infer: true })
      }
    )
  }

  private generateRefreshToken() {
    return randomBytes(64).toString('hex')
  }

  private generateToken() {
    return randomBytes(32).toString('base64url')
  }

  private getCachedRefreshResult(tokenHash: string) {
    return this.cache.get<RefreshResult>(this.refreshResultKey(tokenHash))
  }

  private async waitForRefreshResult(tokenHash: string) {
    const deadline = Date.now() + REFRESH_RESULT_WAIT_MS

    while (Date.now() < deadline) {
      const result = await this.getCachedRefreshResult(tokenHash)

      if (result) {
        return result
      }

      await new Promise((resolve) => setTimeout(resolve, REFRESH_RESULT_POLL_INTERVAL_MS))
    }

    return null
  }

  private refreshResultKey(tokenHash: string) {
    return `auth:refresh:result:${tokenHash}`
  }

  private hashToken(hashToken: string) {
    return createHash('sha256').update(hashToken).digest('hex')
  }

  private addMinutes(minutes: number) {
    return new Date(Date.now() + minutes * 60 * 1000)
  }

  private addDays(days: number) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  }

  private async hashPassword(rawPassword: string) {
    return argon2.hash(rawPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    })
  }

  private async verifyPassword(hashedPassword: string, rawPassword: string) {
    return argon2.verify(hashedPassword, rawPassword)
  }

  private async createToken(userId: string, type: ConfirmationTokenType, expiresAt: Date, targetEmail?: string) {
    const rawToken = this.generateToken()
    const tokenHash = this.hashToken(rawToken)

    await this.prisma.$transaction(async (tx) => {
      await this.confirmationTokenRepo.supersedePendingForUser(userId, type, tx)
      await this.confirmationTokenRepo.create(userId, tokenHash, type, expiresAt, targetEmail, tx)
    })

    return rawToken
  }

  private async getToken(rawToken: string, type: ConfirmationTokenType) {
    const token = await this.confirmationTokenRepo.findByHash(this.hashToken(rawToken))

    if (!token || token.type !== type) {
      throw new TokenNotFoundException()
    }

    if (token.status === ConfirmationTokenStatus.SUPERSEDED) {
      throw new TokenSupersededException()
    }

    if (token.status === ConfirmationTokenStatus.REDEEMED) {
      throw new TokenAlreadyRedeemedException()
    }

    if (token.expiresAt < new Date()) {
      throw new TokenExpiredException()
    }

    return token
  }
}
