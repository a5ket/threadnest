import { ACCESS_TOKEN_COOKIE } from 'src/common/constants/auth-cookie.constants'

function getCookie(cookieHeader: string | undefined, name: string): string | null {
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

/**
 * Reads the access token from the `Authorization: Bearer` header, falling back to the httpOnly
 * cookie — so the same guards work for both API clients and the cookie-based browser session.
 *
 * @param request - An object exposing the relevant headers (not the full Express/Fastify request type).
 * @returns The raw token, or null if neither the header nor the cookie carries one.
 */
export function extractAccessToken(request: { headers: { authorization?: string, cookie?: string } }): string | null {
  const header = request.headers.authorization

  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length)
  }

  return getCookie(request.headers.cookie, ACCESS_TOKEN_COOKIE)
}
