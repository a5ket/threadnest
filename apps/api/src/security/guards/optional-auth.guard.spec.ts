import { createExecutionContext } from 'test/factories/execution-context.factory'
import { OptionalAuthGuard } from './optional-auth.guard'

describe('OptionalAuthGuard', () => {
  const jwt = { verifyAsync: jest.fn() }
  const config = { getOrThrow: jest.fn().mockReturnValue('access-secret') }

  const guard = new OptionalAuthGuard(jwt as any, config as any)

  beforeEach(() => {
    jest.clearAllMocks()
    config.getOrThrow.mockReturnValue('access-secret')
  })

  it('allows the request through with no user attached when there is no token', async () => {
    const request = { headers: {} }
    const context = createExecutionContext(request)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect((request as any).user).toBeUndefined()
  })

  it('allows the request through with no user attached when the token fails verification', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad signature'))
    const request = { headers: { authorization: 'Bearer bad-token' } }
    const context = createExecutionContext(request)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect((request as any).user).toBeUndefined()
  })

  it('attaches the decoded user to the request when the token verifies', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'user@example.com', sid: 'session-1', emailVerified: true })
    const request = { headers: { authorization: 'Bearer good-token' } }
    const context = createExecutionContext(request)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect((request as any).user).toEqual({ id: 'user-1', email: 'user@example.com', sid: 'session-1', emailVerified: true })
  })
})
