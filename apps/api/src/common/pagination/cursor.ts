/**
 * Encodes a keyset-pagination cursor from a timestamp and tiebreaker id — the standard cursor
 * shape used across most cursor-paginated listings in this codebase.
 *
 * @param date - The sort timestamp of the last item on the current page.
 * @param id - That item's id, as a tiebreaker for rows sharing the same timestamp.
 * @returns An opaque base64 cursor string.
 */
export function encodeCursor(date: Date, id: string) {
  return Buffer.from(`${date.toISOString()}|${id}`).toString('base64')
}

/**
 * @param cursor - A cursor produced by {@link encodeCursor}.
 * @returns The decoded timestamp and id.
 * @throws {Error} `cursor` is malformed (not valid base64, wrong shape, or an invalid date/empty
 * id) — callers are expected to catch this and surface a domain-specific exception
 * (`InvalidCursorException`) rather than let the raw error propagate.
 */
export function decodeCursor(cursor: string): { date: Date; id: string } {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8')
    const [dateStr, id] = decoded.split('|')
    const date = new Date(dateStr)

    if (isNaN(date.getTime()) || !id?.trim()) {
      throw new Error()
    }

    return { date, id }
  } catch {
    throw new Error('Invalid cursor')
  }
}

/**
 * Numeric variant of {@link encodeCursor}, for listings sorted by something other than a
 * timestamp (e.g. a score or rank).
 *
 * @param value - The sort value of the last item on the current page.
 * @param id - That item's id, as a tiebreaker for rows sharing the same value.
 * @returns An opaque base64 cursor string.
 */
export function encodeNumericCursor(value: number, id: string) {
  return Buffer.from(`${value}|${id}`).toString('base64')
}

/**
 * @param cursor - A cursor produced by {@link encodeNumericCursor}.
 * @returns The decoded value and id.
 * @throws {Error} `cursor` is malformed — see {@link decodeCursor}.
 */
export function decodeNumericCursor(cursor: string): { value: number; id: string } {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8')
    const [valueStr, id] = decoded.split('|')
    const value = Number(valueStr)

    if (isNaN(value) || !id?.trim()) {
      throw new Error()
    }

    return { value, id }
  } catch {
    throw new Error('Invalid cursor')
  }
}
