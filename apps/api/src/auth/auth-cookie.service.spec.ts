import type { Request, Response } from 'express'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from 'src/common/constants/auth-cookie.constants'
import { AuthCookieService } from './auth-cookie.service'

describe('AuthCookieService', () => {
  const service = new AuthCookieService()
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn()
  } as unknown as Response

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets access and refresh cookies', () => {
    service.setTokens(response, 'access-token', 'refresh-token')

    const options = {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    }

    expect(response.cookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, 'access-token', options)
    expect(response.cookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, 'refresh-token', options)
  })

  it('reads and decodes the refresh token cookie', () => {
    const request = {
      headers: { cookie: `other=value; ${REFRESH_TOKEN_COOKIE}=refresh%20token` }
    } as Request

    expect(service.getRefreshToken(request)).toBe('refresh token')
  })

  it('returns null for a missing or malformed refresh token cookie', () => {
    const missing = { headers: {} } as Request
    const malformed = {
      headers: { cookie: `${REFRESH_TOKEN_COOKIE}=%E0%A4%A` }
    } as Request

    expect(service.getRefreshToken(missing)).toBeNull()
    expect(service.getRefreshToken(malformed)).toBeNull()
  })

  it('clears access and refresh cookies', () => {
    service.clearTokens(response)

    expect(response.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, expect.any(Object))
    expect(response.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, expect.any(Object))
  })
})
