import { createExecutionContext } from 'test/factories/execution-context.factory'
import { EmailVerificationRequiredException } from 'src/common/exceptions/email-verification-required.exception'
import { VerifiedGuard } from './verified.guard'

describe('VerifiedGuard', () => {
  const guard = new VerifiedGuard()

  it('allows the request through when the current user has a verified email', () => {
    const context = createExecutionContext({ user: { id: 'user-1', emailVerified: true } })

    expect(guard.canActivate(context)).toBe(true)
  })

  it('throws EmailVerificationRequiredException when the user has not verified their email', () => {
    const context = createExecutionContext({ user: { id: 'user-1', emailVerified: false } })

    expect(() => guard.canActivate(context)).toThrow(EmailVerificationRequiredException)
  })

  it('throws EmailVerificationRequiredException when there is no user on the request at all', () => {
    const context = createExecutionContext({})

    expect(() => guard.canActivate(context)).toThrow(EmailVerificationRequiredException)
  })
})
