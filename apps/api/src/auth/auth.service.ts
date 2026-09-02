import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { PinoLogger } from 'nestjs-pino'
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
import { UserSuspensionService } from 'src/user/suspension/user-suspension.service'
import { RefreshTokenRepository } from './refresh-token.repository'
import { ConfirmationTokenStatus, ConfirmationTokenType } from 'generated/prisma/enums'
import { ConfirmationTokenRepository } from './confirmation-token.repository'
import { UserSuspendedException } from './exceptions/user-suspended.exception'

type RefreshResult = {
  accessToken: string
  refreshToken: string
}

const REFRESH_RESULT_TTL_MS = 15_000
const REFRESH_RESULT_WAIT_MS = 2_000
const REFRESH_RESULT_POLL_INTERVAL_MS = 50

/**
 * Account lifecycle: registration, login/logout, password and email verification/reset, and
 * refresh-token rotation.
 */
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
    private readonly emailService: EmailService,
    private readonly userSuspensions: UserSuspensionService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(AuthService.name)
  }

  /**
   * Creates the account, starts a session, and kicks off email verification.
   *
   * @param dto - Registration payload (email + password).
   * @returns The new access/refresh token pair.
   * @throws {EmailTakenException} The email is already registered.
   */
  async register(dto: RegisterDto) {
    const exists = await this.userService.existsByEmail(dto.email)

    if (exists) {
      throw new EmailTakenException()
    }

    const passwordHash = await this.hashPassword(dto.password)
    const user = await this.userService.create(dto.email, passwordHash)
    const tokens = await this.createSession(user.id, user.email, false)

    this.logger.info({ userId: user.id }, 'User registered')
    void this.eventBus.publish(new UserRegisteredEvent({ userId: user.id, email: user.email }))
    void this.requestEmailVerification(user.id)

    return tokens
  }

  /**
   * Verifies credentials and starts a session.
   *
   * @param dto - Login payload (email + password).
   * @returns The new access/refresh token pair.
   * @throws {InvalidCredentialsException} Unknown email, or the password doesn't match.
   * @throws {UserSuspendedException} The account is currently suspended.
   */
  async login(dto: LoginDto) {
    const user = await this.userService.findByEmailWithCredentials(dto.email)

    if (!user?.passwordHash) {
      this.logger.warn({ email: dto.email }, 'Login failed: unknown email')
      throw new InvalidCredentialsException()
    }

    const isPasswordValid = await this.verifyPassword(user.passwordHash, dto.password)

    if (!isPasswordValid) {
      this.logger.warn({ userId: user.id }, 'Login failed: invalid password')
      throw new InvalidCredentialsException()
    }

    const activeSuspension = await this.userSuspensions.getActive(user.id)

    if (activeSuspension) {
      this.logger.warn({ userId: user.id }, 'Login blocked: user suspended')
      throw new UserSuspendedException(activeSuspension.reason)
    }

    const tokens = await this.createSession(user.id, user.email, user.emailVerifiedAt !== null)

    this.logger.info({ userId: user.id }, 'User logged in')
    void this.eventBus.publish(new UserLoggedInEvent({ userId: user.id, email: user.email }))

    return tokens
  }

  /**
   * Revokes the refresh token for one session — signs the caller out of just this device/tab.
   *
   * @param userId - The session owner.
   * @param sessionId - The session to revoke, from the caller's access token (`sid` claim).
   * @returns `{ success: true }`.
   */
  async logoutCurrentSession(userId: string, sessionId: string) {
    await this.refreshTokenRepo.revokeOne(sessionId, userId)

    void this.eventBus.publish(new UserLoggedOutEvent({ userId, sessionId }))

    return { success: true }
  }

  /**
   * Revokes every refresh token for the user — signs them out on every device.
   *
   * @param userId - The account to sign out everywhere.
   * @returns `{ success: true }`.
   */
  async logoutAllSessions(userId: string) {
    await this.refreshTokenRepo.revokeAll(userId)

    void this.eventBus.publish(new UserSessionsRevokedEvent({ userId }))

    return { success: true }
  }

  /**
   * Rotates a refresh token into a new access/refresh pair.
   *
   * Refresh tokens are single-use, but the same raw token can legitimately arrive twice in a race
   * (e.g. two tabs refreshing at once), not just via replay. The first request to atomically claim
   * the token via {@link RefreshTokenRepository.rotate} wins; its result is cached briefly under the
   * token's hash so a near-simultaneous second request returns that same new pair instead of being
   * rejected as reuse of an already-revoked token.
   *
   * @param rawRefreshToken - The raw (unhashed) refresh token from the request body or cookie.
   * @returns The new access/refresh token pair.
   * @throws {InvalidRefreshTokenException} Unknown token, or revoked outside the grace window
   *   with no cached winner to return.
   * @throws {RefreshTokenExpiredException} The token is valid but past its expiry.
   * @throws {UserSuspendedException} The owning account is currently suspended.
   */
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

      this.logger.warn({ userId: currentSession.userId }, 'Refresh rejected: token already revoked')
      throw new InvalidRefreshTokenException()
    }

    if (currentSession.expiresAt < new Date()) {
      throw new RefreshTokenExpiredException()
    }

    const activeSuspension = await this.userSuspensions.getActive(currentSession.user.id)

    if (activeSuspension) {
      throw new UserSuspendedException(activeSuspension.reason)
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

  /**
   * Verifies the current password before setting a new one.
   *
   * @param userId - The account to update.
   * @param currentPassword - Must match the stored hash.
   * @param newPassword - Must differ from the current password.
   * @throws {InvalidCredentialsException} The current password is wrong.
   * @throws {SamePasswordException} The new password matches the current one.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userService.getByIdWithCredentials(userId)

    if (!user?.passwordHash || !(await this.verifyPassword(user.passwordHash, currentPassword))) {
      this.logger.warn({ userId }, 'Change password failed: invalid current password')
      throw new InvalidCredentialsException()
    }

    if (await this.verifyPassword(user.passwordHash, newPassword)) {
      throw new SamePasswordException()
    }

    const passwordHash = await this.hashPassword(newPassword)
    await this.userService.updatePassword(userId, passwordHash)

    this.logger.info({ userId }, 'Password changed')
  }

  /**
   * Issues a fresh verification token (superseding any still-pending one) and emails it.
   *
   * @param userId - The account to verify.
   * @returns The raw token, so callers like {@link register} can use it without a round trip.
   */
  async requestEmailVerification(userId: string) {
    const user = await this.userService.findByIdWithEmail(userId)
    const token = await this.createToken(userId, ConfirmationTokenType.EMAIL_VERIFICATION, this.addDays(1))

    void this.eventBus.publish(new EmailVerificationRequestedEvent({ userId, email: user.email }))
    void this.emailService.sendVerificationEmail(user.email, token)

    return token
  }

  /**
   * Redeems a verification token and marks the account's email verified.
   *
   * @param rawToken - The raw token from the verification link/email.
   */
  async confirmEmailVerification(rawToken: string) {
    const token = await this.getToken(rawToken, ConfirmationTokenType.EMAIL_VERIFICATION)

    await this.prisma.$transaction(async (tx) => {
      await this.confirmationTokenRepo.redeem(token.id, tx)
      await this.userService.markEmailVerified(token.userId, tx)
    })

    void this.eventBus.publish(new EmailVerifiedEvent({ userId: token.userId }))
  }

  /**
   * Emails a reset token if the address belongs to an account. Silently no-ops otherwise, so this
   * can't be used to enumerate registered emails.
   *
   * @param email - The address to send a reset link to, if it exists.
   */
  async requestPasswordReset(email: string) {
    const user = await this.userService.findByEmailWithCredentials(email)

    if (!user) {
      return
    }

    const token = await this.createToken(user.id, ConfirmationTokenType.PASSWORD_RESET, this.addMinutes(15))

    void this.eventBus.publish(new PasswordResetRequestedEvent({ userId: user.id, email: user.email }))
    void this.emailService.sendPasswordResetEmail(user.email, token)
  }

  /**
   * Validates a reset link before showing the "set new password" form — throws unless the token
   * is a valid, unredeemed, unexpired password-reset token.
   *
   * @param rawToken - The raw token from the reset link.
   */
  async validatePasswordResetToken(rawToken: string) {
    await this.getToken(rawToken, ConfirmationTokenType.PASSWORD_RESET)
  }

  /**
   * Redeems the token, sets the new password, and revokes every existing session — a reset logs
   * the user out everywhere.
   *
   * @param rawToken - The raw token from the reset link.
   * @param password - The new password.
   * @throws {SamePasswordException} The new password matches the current one.
   */
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

    this.logger.info({ userId: token.userId }, 'Password reset')
    void this.eventBus.publish(new PasswordResetEvent({ userId: token.userId }))
  }

  /**
   * Emails a confirmation token to the new address.
   *
   * @param userId - The account requesting the change.
   * @param newEmail - The address to move to, pending confirmation.
   * @throws {EmailTakenException} `newEmail` is unchanged, or already registered to someone else.
   */
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

  /**
   * Redeems the token and applies the pending email change.
   *
   * @param rawToken - The raw token from the confirmation link.
   * @throws {TokenNotFoundException} The token has no target email attached (shouldn't happen
   *   for a genuine `EMAIL_CHANGE` token).
   */
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

  /**
   * Short-polls the cache for a rotation result another concurrent request may be about to write.
   *
   * @param tokenHash - Hash of the refresh token whose rotation result to wait for.
   * @returns The cached result, or null if it hasn't appeared within {@link REFRESH_RESULT_WAIT_MS}.
   */
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

  /**
   * Looks up a confirmation token by its raw value and validates type/status/expiry, throwing
   * the specific exception for whichever check fails first.
   *
   * @param rawToken - The raw token to look up.
   * @param type - The expected token type — a mismatch is treated as not found.
   * @throws {TokenNotFoundException} No matching token, or it's for a different purpose.
   * @throws {TokenSupersededException} A newer token of this type was issued since.
   * @throws {TokenAlreadyRedeemedException} Already used.
   * @throws {TokenExpiredException} Past its expiry.
   */
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
