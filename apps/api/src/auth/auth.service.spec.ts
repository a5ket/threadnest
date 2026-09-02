import { createHash } from 'crypto'
import { ConfirmationTokenStatus, ConfirmationTokenType } from 'generated/prisma/enums'
import * as argon2 from 'argon2'
import { createMockCacheService } from 'test/factories/cache-service.mock-factory'
import { createMockConfirmationTokenRepository } from 'test/factories/confirmation-token-repository.mock-factory'
import { createMockEmailService } from 'test/factories/email-service.mock-factory'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockLogger } from 'test/factories/logger.mock-factory'
import { createMockRefreshTokenRepository } from 'test/factories/refresh-token-repository.mock-factory'
import { createMockUserService } from 'test/factories/user-service.mock-factory'
import { createMockUserSuspensionService } from 'test/factories/user-suspension-service.mock-factory'
import { EmailChangedEvent } from './events/email-changed.event'
import { EmailChangeRequestedEvent } from './events/email-change-requested.event'
import { EmailVerificationRequestedEvent } from './events/email-verification-requested.event'
import { EmailVerifiedEvent } from './events/email-verified.event'
import { PasswordResetEvent } from './events/password-reset.event'
import { PasswordResetRequestedEvent } from './events/password-reset-requested.event'
import { UserLoggedInEvent } from './events/user-logged-in.event'
import { UserLoggedOutEvent } from './events/user-logged-out.event'
import { UserRegisteredEvent } from './events/user-registered.event'
import { UserSessionsRevokedEvent } from './events/user-sessions-revoked.event'
import { EmailTakenException } from './exceptions/email-taken.exception'
import { InvalidCredentialsException } from './exceptions/invalid-credentials.exception'
import { InvalidRefreshTokenException } from './exceptions/invalid-refresh-token.exception'
import { RefreshTokenExpiredException } from './exceptions/refresh-token-expired.exception'
import { SamePasswordException } from './exceptions/same-password.exception'
import { TokenAlreadyRedeemedException } from './exceptions/token-already-redeemed.exception'
import { TokenExpiredException } from './exceptions/token-expired.exception'
import { TokenNotFoundException } from './exceptions/token-not-found.exception'
import { TokenSupersededException } from './exceptions/token-superseded.exception'
import { UserSuspendedException } from './exceptions/user-suspended.exception'
import { AuthService } from './auth.service'

jest.mock('argon2', () => ({
  argon2id: 'argon2id',
  hash: jest.fn(),
  verify: jest.fn(),
}))

const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

describe('AuthService', () => {
  const rawRefreshToken = 'a'.repeat(128)
  const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex')
  const resultKey = `auth:refresh:result:${tokenHash}`
  const cachedResult = { accessToken: 'cached-access-token', refreshToken: 'cached-refresh-token' }

  const userService = createMockUserService()
  const refreshTokenRepo = createMockRefreshTokenRepository()
  const confirmationTokenRepo = createMockConfirmationTokenRepository()
  const prisma = { $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback({} as any)) }
  const jwt = { signAsync: jest.fn() }
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'refreshTokenLifetimeDays') return 30
      if (key === 'jwtAccessSecret') return 'access-secret'
      if (key === 'jwtAccessExpiresIn') return '15m'
      throw new Error(`Unexpected config key: ${key}`)
    }),
  }
  const cache = createMockCacheService()
  const eventBus = createMockEventBus()
  const emailService = createMockEmailService()
  const userSuspensions = createMockUserSuspensionService()
  const logger = createMockLogger()

  const service = new AuthService(
    userService as any,
    refreshTokenRepo as any,
    confirmationTokenRepo as any,
    prisma as any,
    jwt as any,
    config as any,
    cache,
    eventBus,
    emailService as any,
    userSuspensions as any,
    logger as any,
  )

  const session = (overrides: Record<string, unknown> = {}) => ({
    id: 'session-1',
    userId: 'user-1',
    tokenHash,
    familyId: 'family-1',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    replacedByTokenId: null,
    user: {
      id: 'user-1',
      email: 'user@example.com',
      emailVerifiedAt: new Date(),
    },
    ...overrides,
  })

  const confirmationToken = (overrides: Record<string, unknown> = {}) => ({
    id: 'token-1',
    userId: 'user-1',
    type: ConfirmationTokenType.EMAIL_VERIFICATION,
    status: ConfirmationTokenStatus.PENDING,
    expiresAt: new Date(Date.now() + 60_000),
    targetEmail: null,
    user: { id: 'user-1', email: 'user@example.com' },
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    cache.get.mockResolvedValue(null)
    cache.set.mockResolvedValue(undefined)
    eventBus.publish.mockResolvedValue(undefined)
    jwt.signAsync.mockResolvedValue('new-access-token')
    userSuspensions.getActive.mockResolvedValue(null)
    refreshTokenRepo.create.mockResolvedValue({ id: 'session-1' })
    ;(argon2.hash as jest.Mock).mockResolvedValue('hashed-password')
    ;(argon2.verify as jest.Mock).mockResolvedValue(true)
  })

  describe('refresh', () => {
    it('rotates the refresh token and caches the result for 15 seconds', async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(session() as any)
      refreshTokenRepo.rotate.mockResolvedValue({ id: 'session-2' })

      const result = await service.refresh(rawRefreshToken)

      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toHaveLength(128)
      expect(refreshTokenRepo.rotate).toHaveBeenCalledWith(
        'session-1',
        'user-1',
        expect.any(String),
        'family-1',
        expect.any(Date),
      )
      expect(cache.set).toHaveBeenCalledWith(resultKey, result, 15_000)
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
    })

    it('returns a cached refresh result without querying the database', async () => {
      cache.get.mockResolvedValue(cachedResult)

      await expect(service.refresh(rawRefreshToken)).resolves.toEqual(cachedResult)

      expect(refreshTokenRepo.findByHash).not.toHaveBeenCalled()
      expect(refreshTokenRepo.rotate).not.toHaveBeenCalled()
    })

    it('rejects an unknown refresh token', async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(null)

      await expect(service.refresh(rawRefreshToken)).rejects.toThrow(InvalidRefreshTokenException)
    })

    it('returns the cached winner result when atomic rotation loses a race', async () => {
      cache.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(cachedResult)
      refreshTokenRepo.findByHash.mockResolvedValue(session() as any)
      refreshTokenRepo.rotate.mockResolvedValue(null)

      await expect(service.refresh(rawRefreshToken)).resolves.toEqual(cachedResult)

      expect(cache.set).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('returns a cached result for a recently revoked token', async () => {
      cache.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(cachedResult)
      refreshTokenRepo.findByHash.mockResolvedValue(session({ revokedAt: new Date() }) as any)

      await expect(service.refresh(rawRefreshToken)).resolves.toEqual(cachedResult)

      expect(refreshTokenRepo.rotate).not.toHaveBeenCalled()
    })

    it('rejects a revoked token after the grace period', async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(session({
        revokedAt: new Date(Date.now() - 15_001),
      }) as any)

      await expect(service.refresh(rawRefreshToken)).rejects.toThrow(InvalidRefreshTokenException)
    })

    it('rejects an expired refresh token', async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(session({
        expiresAt: new Date(Date.now() - 1),
      }) as any)

      await expect(service.refresh(rawRefreshToken)).rejects.toThrow(RefreshTokenExpiredException)
    })

    it('rejects refreshing a session for a suspended user and never rotates the token', async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(session() as any)
      userSuspensions.getActive.mockResolvedValue({ reason: 'Spam' })

      await expect(service.refresh(rawRefreshToken)).rejects.toThrow(UserSuspendedException)

      expect(refreshTokenRepo.rotate).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {
    const dto = { email: 'new@example.com', password: 'Password1!' }

    it('throws EmailTakenException without creating a user when the email is already registered', async () => {
      userService.existsByEmail.mockResolvedValue(true)

      await expect(service.register(dto as any)).rejects.toThrow(EmailTakenException)

      expect(userService.create).not.toHaveBeenCalled()
    })

    it('creates the user, starts a session, and publishes UserRegisteredEvent', async () => {
      userService.existsByEmail.mockResolvedValue(false)
      userService.create.mockResolvedValue({ id: 'user-1', email: dto.email } as any)
      userService.findByIdWithEmail.mockResolvedValue({ id: 'user-1', email: dto.email })

      const result = await service.register(dto)

      expect(argon2.hash).toHaveBeenCalledWith(dto.password, expect.objectContaining({ type: 'argon2id' }))
      expect(userService.create).toHaveBeenCalledWith(dto.email, 'hashed-password')
      expect(result.accessToken).toBe('new-access-token')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserRegisteredEvent))
    })

    it('kicks off email verification for the new user', async () => {
      userService.existsByEmail.mockResolvedValue(false)
      userService.create.mockResolvedValue({ id: 'user-1', email: dto.email } as any)
      userService.findByIdWithEmail.mockResolvedValue({ id: 'user-1', email: dto.email })

      await service.register(dto)
      await flushPromises()

      expect(confirmationTokenRepo.create).toHaveBeenCalledWith(
        'user-1', expect.any(String), ConfirmationTokenType.EMAIL_VERIFICATION, expect.any(Date), undefined, {},
      )
      expect(emailService.sendVerificationEmail).toHaveBeenCalled()
    })
  })

  describe('login', () => {
    const dto = { email: 'user@example.com', password: 'Password1!' }

    it('rejects an unknown email without checking the password', async () => {
      userService.findByEmailWithCredentials.mockResolvedValue(null)

      await expect(service.login(dto as any)).rejects.toThrow(InvalidCredentialsException)

      expect(argon2.verify).not.toHaveBeenCalled()
    })

    it('rejects a user with no password hash on file', async () => {
      userService.findByEmailWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: null } as any)

      await expect(service.login(dto as any)).rejects.toThrow(InvalidCredentialsException)
    })

    it('rejects an incorrect password', async () => {
      userService.findByEmailWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed', email: dto.email, emailVerifiedAt: null } as any)
      ;(argon2.verify as jest.Mock).mockResolvedValue(false)

      await expect(service.login(dto as any)).rejects.toThrow(InvalidCredentialsException)
    })

    it('blocks a suspended user before creating a session', async () => {
      userService.findByEmailWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed', email: dto.email, emailVerifiedAt: null } as any)
      userSuspensions.getActive.mockResolvedValue({ reason: 'Spam' })

      await expect(service.login(dto as any)).rejects.toThrow(UserSuspendedException)

      expect(refreshTokenRepo.create).not.toHaveBeenCalled()
    })

    it('creates a session and publishes UserLoggedInEvent on success', async () => {
      userService.findByEmailWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed', email: dto.email, emailVerifiedAt: new Date() } as any)

      const result = await service.login(dto)

      expect(result.accessToken).toBe('new-access-token')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserLoggedInEvent))
    })
  })

  describe('logoutCurrentSession', () => {
    it('revokes only the current session and publishes UserLoggedOutEvent', async () => {
      const result = await service.logoutCurrentSession('user-1', 'session-1')

      expect(refreshTokenRepo.revokeOne).toHaveBeenCalledWith('session-1', 'user-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserLoggedOutEvent))
      expect(result).toEqual({ success: true })
    })
  })

  describe('logoutAllSessions', () => {
    it('revokes every session and publishes UserSessionsRevokedEvent', async () => {
      const result = await service.logoutAllSessions('user-1')

      expect(refreshTokenRepo.revokeAll).toHaveBeenCalledWith('user-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserSessionsRevokedEvent))
      expect(result).toEqual({ success: true })
    })
  })

  describe('changePassword', () => {
    it('rejects an incorrect current password without updating anything', async () => {
      userService.getByIdWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed' })
      ;(argon2.verify as jest.Mock).mockResolvedValue(false)

      await expect(service.changePassword('user-1', 'wrong', 'NewPassword1!')).rejects.toThrow(InvalidCredentialsException)

      expect(userService.updatePassword).not.toHaveBeenCalled()
    })

    it('rejects a user with no password hash on file', async () => {
      userService.getByIdWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: null })

      await expect(service.changePassword('user-1', 'whatever', 'NewPassword1!')).rejects.toThrow(InvalidCredentialsException)
    })

    it('rejects reusing the current password as the new one', async () => {
      userService.getByIdWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed' })
      ;(argon2.verify as jest.Mock).mockResolvedValue(true)

      await expect(service.changePassword('user-1', 'Password1!', 'Password1!')).rejects.toThrow(SamePasswordException)

      expect(userService.updatePassword).not.toHaveBeenCalled()
    })

    it('hashes and stores the new password once validated', async () => {
      userService.getByIdWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed' })
      ;(argon2.verify as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)

      await service.changePassword('user-1', 'Password1!', 'NewPassword1!')

      expect(userService.updatePassword).toHaveBeenCalledWith('user-1', 'hashed-password')
    })
  })

  describe('requestEmailVerification', () => {
    it('supersedes any pending token, creates a new one, and sends the verification email', async () => {
      userService.findByIdWithEmail.mockResolvedValue({ id: 'user-1', email: 'user@example.com' })

      const token = await service.requestEmailVerification('user-1')

      expect(confirmationTokenRepo.supersedePendingForUser).toHaveBeenCalledWith('user-1', ConfirmationTokenType.EMAIL_VERIFICATION, {})
      expect(confirmationTokenRepo.create).toHaveBeenCalledWith('user-1', expect.any(String), ConfirmationTokenType.EMAIL_VERIFICATION, expect.any(Date), undefined, {})
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith('user@example.com', token)
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(EmailVerificationRequestedEvent))
    })
  })

  describe('confirmEmailVerification', () => {
    it('redeems the token, marks the email verified, and publishes EmailVerifiedEvent', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken() as any)

      await service.confirmEmailVerification('raw-token')

      expect(confirmationTokenRepo.redeem).toHaveBeenCalledWith('token-1', {})
      expect(userService.markEmailVerified).toHaveBeenCalledWith('user-1', {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(EmailVerifiedEvent))
    })

    it('throws TokenNotFoundException when no token matches', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(null)

      await expect(service.confirmEmailVerification('raw-token')).rejects.toThrow(TokenNotFoundException)
    })

    it('throws TokenNotFoundException when the token is for a different purpose', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ type: ConfirmationTokenType.PASSWORD_RESET }) as any)

      await expect(service.confirmEmailVerification('raw-token')).rejects.toThrow(TokenNotFoundException)
    })

    it('throws TokenSupersededException for a superseded token', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ status: ConfirmationTokenStatus.SUPERSEDED }) as any)

      await expect(service.confirmEmailVerification('raw-token')).rejects.toThrow(TokenSupersededException)
    })

    it('throws TokenAlreadyRedeemedException for an already-redeemed token', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ status: ConfirmationTokenStatus.REDEEMED }) as any)

      await expect(service.confirmEmailVerification('raw-token')).rejects.toThrow(TokenAlreadyRedeemedException)
    })

    it('throws TokenExpiredException for an expired token', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ expiresAt: new Date(Date.now() - 1) }) as any)

      await expect(service.confirmEmailVerification('raw-token')).rejects.toThrow(TokenExpiredException)
    })
  })

  describe('requestPasswordReset', () => {
    it('silently does nothing for an unknown email', async () => {
      userService.findByEmailWithCredentials.mockResolvedValue(null)

      await service.requestPasswordReset('nobody@example.com')

      expect(confirmationTokenRepo.create).not.toHaveBeenCalled()
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('creates a reset token and sends the reset email for a known address', async () => {
      userService.findByEmailWithCredentials.mockResolvedValue({ id: 'user-1', email: 'user@example.com' } as any)

      await service.requestPasswordReset('user@example.com')

      expect(confirmationTokenRepo.create).toHaveBeenCalledWith('user-1', expect.any(String), ConfirmationTokenType.PASSWORD_RESET, expect.any(Date), undefined, {})
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled()
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(PasswordResetRequestedEvent))
    })
  })

  describe('validatePasswordResetToken', () => {
    it('resolves without throwing for a valid token', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ type: ConfirmationTokenType.PASSWORD_RESET }) as any)

      await expect(service.validatePasswordResetToken('raw-token')).resolves.toBeUndefined()
    })

    it('throws for an invalid token', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(null)

      await expect(service.validatePasswordResetToken('raw-token')).rejects.toThrow(TokenNotFoundException)
    })
  })

  describe('confirmPasswordReset', () => {
    it('rejects resetting to the same password', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ type: ConfirmationTokenType.PASSWORD_RESET }) as any)
      userService.getByIdWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed' })
      ;(argon2.verify as jest.Mock).mockResolvedValue(true)

      await expect(service.confirmPasswordReset('raw-token', 'Password1!')).rejects.toThrow(SamePasswordException)

      expect(userService.updatePassword).not.toHaveBeenCalled()
    })

    it('resets the password, redeems the token, and revokes every session', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ type: ConfirmationTokenType.PASSWORD_RESET }) as any)
      userService.getByIdWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed' })
      ;(argon2.verify as jest.Mock).mockResolvedValue(false)

      await service.confirmPasswordReset('raw-token', 'NewPassword1!')

      expect(confirmationTokenRepo.redeem).toHaveBeenCalledWith('token-1', {})
      expect(userService.updatePassword).toHaveBeenCalledWith('user-1', 'hashed-password', {})
      expect(refreshTokenRepo.revokeAll).toHaveBeenCalledWith('user-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(PasswordResetEvent))
    })

    it('resets successfully even when the account has no password on file yet', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ type: ConfirmationTokenType.PASSWORD_RESET }) as any)
      userService.getByIdWithCredentials.mockResolvedValue({ id: 'user-1', passwordHash: null })

      await service.confirmPasswordReset('raw-token', 'NewPassword1!')

      expect(argon2.verify).not.toHaveBeenCalled()
      expect(userService.updatePassword).toHaveBeenCalledWith('user-1', 'hashed-password', {})
    })
  })

  describe('requestEmailChange', () => {
    it('rejects when the new email matches the current one', async () => {
      userService.findByIdWithEmail.mockResolvedValue({ id: 'user-1', email: 'same@example.com' })

      await expect(service.requestEmailChange('user-1', 'same@example.com')).rejects.toThrow(EmailTakenException)

      expect(confirmationTokenRepo.create).not.toHaveBeenCalled()
    })

    it('rejects when the new email is already registered to someone else', async () => {
      userService.findByIdWithEmail.mockResolvedValue({ id: 'user-1', email: 'old@example.com' })
      userService.existsByEmail.mockResolvedValue(true)

      await expect(service.requestEmailChange('user-1', 'taken@example.com')).rejects.toThrow(EmailTakenException)
    })

    it('creates a change token and emails the new address', async () => {
      userService.findByIdWithEmail.mockResolvedValue({ id: 'user-1', email: 'old@example.com' })
      userService.existsByEmail.mockResolvedValue(false)

      await service.requestEmailChange('user-1', 'new@example.com')

      expect(confirmationTokenRepo.create).toHaveBeenCalledWith('user-1', expect.any(String), ConfirmationTokenType.EMAIL_CHANGE, expect.any(Date), 'new@example.com', {})
      expect(emailService.sendEmailChangeEmail).toHaveBeenCalled()
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(EmailChangeRequestedEvent))
    })
  })

  describe('confirmEmailChange', () => {
    it('throws TokenNotFoundException when the token has no target email', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ type: ConfirmationTokenType.EMAIL_CHANGE, targetEmail: null }) as any)

      await expect(service.confirmEmailChange('raw-token')).rejects.toThrow(TokenNotFoundException)
    })

    it('redeems the token and updates the email on success', async () => {
      confirmationTokenRepo.findByHash.mockResolvedValue(confirmationToken({ type: ConfirmationTokenType.EMAIL_CHANGE, targetEmail: 'new@example.com' }) as any)

      await service.confirmEmailChange('raw-token')

      expect(confirmationTokenRepo.redeem).toHaveBeenCalledWith('token-1', {})
      expect(userService.updateEmail).toHaveBeenCalledWith('user-1', 'new@example.com', {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(EmailChangedEvent))
    })
  })
})
