import { Socket } from 'socket.io'
import { extractAccessToken } from 'src/security/access-token.util'

/**
 * Socket.IO clients normally pass the token via `io(url, { auth: { token } })`; fall back to the
 * same header/cookie extraction the HTTP {@link AuthGuard} uses for clients that can't set `auth`.
 *
 * @param socket - The connecting socket.
 * @returns The access token, or `null` if none was supplied by either method.
 */
export function extractSocketAccessToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token as unknown

  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken
  }

  return extractAccessToken({ headers: socket.handshake.headers })
}
