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

export function extractAccessToken(request: { headers: { authorization?: string, cookie?: string } }): string | null {
  const header = request.headers.authorization

  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length)
  }

  return getCookie(request.headers.cookie, ACCESS_TOKEN_COOKIE)
}
