import { createExecutionContext } from 'test/factories/execution-context.factory'
import { InvalidAccessTokenException } from 'src/auth/exceptions/invalid-access-token.exception'
import { MissingAccessTokenException } from 'src/auth/exceptions/missing-access-token.exception'
import { AuthGuard } from './auth.guard'

describe('AuthGuard', () => {
  const jwt = { verifyAsync: jest.fn() }
  const config = { getOrThrow: jest.fn().mockReturnValue('access-secret') }

  const guard = new AuthGuard(jwt as any, config as any)

  beforeEach(() => {
    jest.clearAllMocks()
    config.getOrThrow.mockReturnValue('access-secret')
  })

  it('throws MissingAccessTokenException when no token is present', async () => {
    const context = createExecutionContext({ headers: {} })

    await expect(guard.canActivate(context)).rejects.toThrow(MissingAccessTokenException)

    expect(jwt.verifyAsync).not.toHaveBeenCalled()
  })

  it('throws InvalidAccessTokenException when the token fails verification', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad signature'))
    const context = createExecutionContext({ headers: { authorization: 'Bearer bad-token' } })

    await expect(guard.canActivate(context)).rejects.toThrow(InvalidAccessTokenException)
  })

  it('attaches the decoded user to the request and allows the request through on success', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'user@example.com', sid: 'session-1', emailVerified: true })
    const request = { headers: { authorization: 'Bearer good-token' } }
    const context = createExecutionContext(request)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect((request as any).user).toEqual({ id: 'user-1', email: 'user@example.com', sid: 'session-1', emailVerified: true })
  })
})
