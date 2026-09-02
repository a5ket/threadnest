import { extractAccessToken } from './access-token.util'

describe('extractAccessToken', () => {
  it('extracts the token from a Bearer authorization header', () => {
    const result = extractAccessToken({ headers: { authorization: 'Bearer abc123' } })

    expect(result).toBe('abc123')
  })

  it('falls back to the cookie when the authorization header uses a different scheme', () => {
    const result = extractAccessToken({ headers: { authorization: 'Basic abc123', cookie: 'access_token=from-cookie' } })

    expect(result).toBe('from-cookie')
  })

  it('extracts the token from the access_token cookie when there is no authorization header', () => {
    const result = extractAccessToken({ headers: { cookie: 'access_token=cookie-token' } })

    expect(result).toBe('cookie-token')
  })

  it('picks the right cookie out of several, ignoring surrounding whitespace', () => {
    const result = extractAccessToken({ headers: { cookie: 'other=1; access_token=cookie-token; another=2' } })

    expect(result).toBe('cookie-token')
  })

  it('URL-decodes the cookie value', () => {
    const result = extractAccessToken({ headers: { cookie: 'access_token=abc%20123' } })

    expect(result).toBe('abc 123')
  })

  it('returns null when the cookie value is malformed percent-encoding', () => {
    const result = extractAccessToken({ headers: { cookie: 'access_token=abc%' } })

    expect(result).toBeNull()
  })

  it('returns null when there is no matching cookie', () => {
    const result = extractAccessToken({ headers: { cookie: 'other=1' } })

    expect(result).toBeNull()
  })

  it('returns null when there is no cookie header at all', () => {
    const result = extractAccessToken({ headers: {} })

    expect(result).toBeNull()
  })

  it('returns null for an empty cookie value', () => {
    const result = extractAccessToken({ headers: { cookie: 'access_token=' } })

    expect(result).toBeNull()
  })
})
