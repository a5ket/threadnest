import { createHash } from 'crypto'
import { InvalidRefreshTokenException } from './exceptions/invalid-refresh-token.exception'
import { RefreshTokenExpiredException } from './exceptions/refresh-token-expired.exception'
import { UserSuspendedException } from './exceptions/user-suspended.exception'
import { AuthService } from './auth.service'

describe('AuthService refresh', () => {
  const rawRefreshToken = 'a'.repeat(128)
  const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex')
  const resultKey = `auth:refresh:result:${tokenHash}`
  const cachedResult = { accessToken: 'cached-access-token', refreshToken: 'cached-refresh-token' }

  const userService = {}
  const refreshTokenRepo = {
    findByHash: jest.fn(),
    rotate: jest.fn()
  }
  const confirmationTokenRepo = {}
  const prisma = {}
  const jwt = { signAsync: jest.fn() }
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'refreshTokenLifetimeDays') return 30
      if (key === 'jwtAccessSecret') return 'access-secret'
      if (key === 'jwtAccessExpiresIn') return '15m'
      throw new Error(`Unexpected config key: ${key}`)
    })
  }
  const cache = {
    get: jest.fn(),
    set: jest.fn()
  }
  const eventBus = { publish: jest.fn() }
  const emailService = {}
  const userSuspensions = { getActive: jest.fn() }

  const service = new AuthService(
    userService as any,
    refreshTokenRepo as any,
    confirmationTokenRepo as any,
    prisma as any,
    jwt as any,
    config as any,
    cache as any,
    eventBus,
    emailService as any,
    userSuspensions as any
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
      emailVerifiedAt: new Date()
    },
    ...overrides
  })

  beforeEach(() => {
    jest.clearAllMocks()
    cache.get.mockResolvedValue(null)
    cache.set.mockResolvedValue(undefined)
    eventBus.publish.mockResolvedValue(undefined)
    jwt.signAsync.mockResolvedValue('new-access-token')
    userSuspensions.getActive.mockResolvedValue(null)
  })

  it('rotates the refresh token and caches the result for 15 seconds', async () => {
    refreshTokenRepo.findByHash.mockResolvedValue(session())
    refreshTokenRepo.rotate.mockResolvedValue({ id: 'session-2' })

    const result = await service.refresh(rawRefreshToken)

    expect(result.accessToken).toBe('new-access-token')
    expect(result.refreshToken).toHaveLength(128)
    expect(refreshTokenRepo.rotate).toHaveBeenCalledWith(
      'session-1',
      'user-1',
      expect.any(String),
      'family-1',
      expect.any(Date)
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

  it('returns the cached winner result when atomic rotation loses a race', async () => {
    cache.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(cachedResult)
    refreshTokenRepo.findByHash.mockResolvedValue(session())
    refreshTokenRepo.rotate.mockResolvedValue(null)

    await expect(service.refresh(rawRefreshToken)).resolves.toEqual(cachedResult)

    expect(cache.set).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })

  it('returns a cached result for a recently revoked token', async () => {
    cache.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(cachedResult)
    refreshTokenRepo.findByHash.mockResolvedValue(session({ revokedAt: new Date() }))

    await expect(service.refresh(rawRefreshToken)).resolves.toEqual(cachedResult)

    expect(refreshTokenRepo.rotate).not.toHaveBeenCalled()
  })

  it('rejects a revoked token after the grace period', async () => {
    refreshTokenRepo.findByHash.mockResolvedValue(session({
      revokedAt: new Date(Date.now() - 15_001)
    }))

    await expect(service.refresh(rawRefreshToken)).rejects.toThrow(InvalidRefreshTokenException)
  })

  it('rejects an expired refresh token', async () => {
    refreshTokenRepo.findByHash.mockResolvedValue(session({
      expiresAt: new Date(Date.now() - 1)
    }))

    await expect(service.refresh(rawRefreshToken)).rejects.toThrow(RefreshTokenExpiredException)
  })

  it('rejects refreshing a session for a suspended user and never rotates the token', async () => {
    refreshTokenRepo.findByHash.mockResolvedValue(session())
    userSuspensions.getActive.mockResolvedValue({ reason: 'Spam' })

    await expect(service.refresh(rawRefreshToken)).rejects.toThrow(UserSuspendedException)

    expect(refreshTokenRepo.rotate).not.toHaveBeenCalled()
  })
})
