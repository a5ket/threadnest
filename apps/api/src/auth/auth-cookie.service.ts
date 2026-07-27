import { Injectable } from '@nestjs/common'
import type { Request, Response } from 'express'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from 'src/common/constants/auth-cookie.constants'

@Injectable()
export class AuthCookieService {
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

  getRefreshToken(request: Request) {
    return this.getCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE)
  }

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
