import type { Request, Response } from 'express'
import { AuthController } from './auth.controller'
import { InvalidRefreshTokenException } from './exceptions/invalid-refresh-token.exception'

describe('AuthController cookies', () => {
  const tokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token'
  }
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logoutCurrentSession: jest.fn(),
    logoutAllSessions: jest.fn(),
    requestEmailVerification: jest.fn(),
    confirmEmailVerification: jest.fn(),
    requestPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
    confirmEmailChange: jest.fn()
  }
  const authCookieService = {
    setTokens: jest.fn(),
    getRefreshToken: jest.fn(),
    clearTokens: jest.fn()
  }
  const controller = new AuthController(authService as any, authCookieService as any)
  const request = { headers: {} } as Request
  const response = {} as Response

  beforeEach(() => {
    jest.clearAllMocks()
    authService.refresh.mockResolvedValue(tokens)
  })

  it('sets cookies after register', async () => {
    const result = { user: { id: 'user-1' }, ...tokens }
    authService.register.mockResolvedValue(result)

    await expect(controller.register({ email: 'user@example.com', password: 'password' }, response)).resolves.toBe(result)

    expect(authCookieService.setTokens).toHaveBeenCalledWith(response, tokens.accessToken, tokens.refreshToken)
  })

  it('sets cookies after login', async () => {
    const result = { user: { id: 'user-1' }, ...tokens }
    authService.login.mockResolvedValue(result)

    await expect(controller.login({ email: 'user@example.com', password: 'password' }, response)).resolves.toBe(result)

    expect(authCookieService.setTokens).toHaveBeenCalledWith(response, tokens.accessToken, tokens.refreshToken)
  })

  it('refreshes using a token from the request body', async () => {
    await expect(controller.refresh({ refreshToken: 'body-token' }, request, response)).resolves.toBe(tokens)

    expect(authService.refresh).toHaveBeenCalledWith('body-token')
    expect(authCookieService.getRefreshToken).not.toHaveBeenCalled()
    expect(authCookieService.setTokens).toHaveBeenCalledWith(response, tokens.accessToken, tokens.refreshToken)
  })

  it('refreshes using the cookie when the body token is absent', async () => {
    authCookieService.getRefreshToken.mockReturnValue('cookie-token')

    await expect(controller.refresh({}, request, response)).resolves.toBe(tokens)

    expect(authService.refresh).toHaveBeenCalledWith('cookie-token')
    expect(authCookieService.setTokens).toHaveBeenCalledWith(response, tokens.accessToken, tokens.refreshToken)
  })

  it('rejects refresh when neither body nor cookie contains a token', async () => {
    authCookieService.getRefreshToken.mockReturnValue(null)

    await expect(controller.refresh({}, request, response)).rejects.toThrow(InvalidRefreshTokenException)

    expect(authService.refresh).not.toHaveBeenCalled()
    expect(authCookieService.setTokens).not.toHaveBeenCalled()
  })

  it('clears cookies after logging out the current session', async () => {
    const user = { id: 'user-1', sid: 'session-1', email: 'user@example.com', emailVerified: true }

    await controller.logout(user, response)

    expect(authService.logoutCurrentSession).toHaveBeenCalledWith('user-1', 'session-1')
    expect(authCookieService.clearTokens).toHaveBeenCalledWith(response)
  })

  it('clears cookies after logging out all sessions', async () => {
    const user = { id: 'user-1', sid: 'session-1', email: 'user@example.com', emailVerified: true }

    await controller.logoutAll(user, response)

    expect(authService.logoutAllSessions).toHaveBeenCalledWith('user-1')
    expect(authCookieService.clearTokens).toHaveBeenCalledWith(response)
  })

  it('requests email verification for the current user', async () => {
    const user = { id: 'user-1', sid: 'session-1', email: 'user@example.com', emailVerified: false }

    await controller.requestEmailVerification(user)

    expect(authService.requestEmailVerification).toHaveBeenCalledWith('user-1')
  })

  it('confirms an email verification token', async () => {
    await controller.confirmEmailVerification({ token: 'raw-token' })

    expect(authService.confirmEmailVerification).toHaveBeenCalledWith('raw-token')
  })

  it('requests a password reset email', async () => {
    await controller.requestPasswordReset({ email: 'user@example.com' })

    expect(authService.requestPasswordReset).toHaveBeenCalledWith('user@example.com')
  })

  it('confirms a password reset token with the new password', async () => {
    await controller.confirmPasswordReset({ token: 'raw-token', password: 'NewPassword1!' })

    expect(authService.confirmPasswordReset).toHaveBeenCalledWith('raw-token', 'NewPassword1!')
  })

  it('confirms an email change token', async () => {
    await controller.confirmEmailChange({ token: 'raw-token' })

    expect(authService.confirmEmailChange).toHaveBeenCalledWith('raw-token')
  })
})
