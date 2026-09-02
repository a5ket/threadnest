import { Injectable } from '@nestjs/common'
import type { Request, Response } from 'express'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from 'src/common/constants/auth-cookie.constants'

/**
 * Reads/writes the access and refresh tokens as httpOnly cookies, mirroring the token pair also
 * returned in response bodies.
 */
@Injectable()
export class AuthCookieService {
  /**
   * Sets both tokens as httpOnly, strict-sameSite cookies (secure in production).
   *
   * @param response - The response to attach cookies to.
   * @param accessToken - The short-lived access token.
   * @param refreshToken - The long-lived refresh token.
   */
  setTokens(response: Response, accessToken: string, refreshToken: string) {
    const options = {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    }

    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, options)
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, options)
  }

  /**
   * Reads the refresh token cookie, used as a fallback when the client didn't send it in the request body.
   *
   * @param request - The incoming request.
   * @returns The refresh token, or null if no cookie is set.
   */
  getRefreshToken(request: Request) {
    return this.getCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE)
  }

  /**
   * Clears both auth cookies, e.g. on logout.
   *
   * @param response - The response to clear cookies on.
   */
  clearTokens(response: Response) {
    const options = {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    }

    response.clearCookie(ACCESS_TOKEN_COOKIE, options)
    response.clearCookie(REFRESH_TOKEN_COOKIE, options)
  }

  /**
   * Parses one named cookie out of a raw `Cookie` header.
   *
   * @param cookieHeader - The raw header value, e.g. `"a=1; b=2"`.
   * @param name - The cookie name to extract.
   * @returns The decoded value, or null if absent or malformed.
   */
  private getCookie(cookieHeader: string | undefined, name: string) {
    const value = cookieHeader
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.slice(name.length + 1)

    if (!value) {
      return null
    }

    try {
      return decodeURIComponent(value)
    } catch {
      return null
    }
  }
}
