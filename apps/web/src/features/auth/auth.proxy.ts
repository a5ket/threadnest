import { env } from '@/config/env'
import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants'

const REFRESH_THRESHOLD_SECONDS = 30

type TokenPayload = {
  exp?: number
}

export async function refreshProxyAuth(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  const hasSession = Boolean(accessToken || refreshToken)

  if (!refreshToken || !shouldRefresh(accessToken)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-has-session', hasSession ? 'true' : 'false')

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const refreshResponse = await fetch(`${env.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') ?? ''
    },
    body: '{}',
    cache: 'no-store'
  })

  if (!refreshResponse.ok) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-has-session', 'false')

    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.cookies.delete(ACCESS_TOKEN_COOKIE)
    response.cookies.delete(REFRESH_TOKEN_COOKIE)
    return response
  }

  const setCookies = refreshResponse.headers.getSetCookie()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('cookie', mergeCookies(request.headers.get('cookie'), setCookies))
  requestHeaders.set('x-has-session', 'true')

  const response = NextResponse.next({
    request: { headers: requestHeaders }
  })

  for (const cookie of setCookies) {
    response.headers.append('set-cookie', cookie)
  }

  return response
}

function shouldRefresh(accessToken: string | undefined) {
  if (!accessToken) {
    return true
  }

  try {
    const payloadSegment = accessToken.split('.')[1]

    if (!payloadSegment) {
      return true
    }

    const payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString()) as TokenPayload
    return typeof payload.exp !== 'number' || payload.exp <= Date.now() / 1000 + REFRESH_THRESHOLD_SECONDS
  }
  catch {
    return true
  }
}

function mergeCookies(cookieHeader: string | null, setCookies: string[]) {
  const cookies = new Map<string, string>()

  for (const cookie of cookieHeader?.split(';') ?? []) {
    const separator = cookie.indexOf('=')

    if (separator !== -1) {
      cookies.set(cookie.slice(0, separator).trim(), cookie.slice(separator + 1).trim())
    }
  }

  for (const setCookie of setCookies) {
    const pair = setCookie.split(';', 1)[0]
    const separator = pair.indexOf('=')

    if (separator !== -1) {
      cookies.set(pair.slice(0, separator), pair.slice(separator + 1))
    }
  }

  return Array.from(cookies, ([name, value]) => `${name}=${value}`).join('; ')
}
