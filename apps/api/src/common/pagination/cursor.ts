export function encodeCursor(date: Date, id: string) {
  return Buffer.from(`${date.toISOString()}|${id}`).toString('base64')
}

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

export function encodeNumericCursor(value: number, id: string) {
  return Buffer.from(`${value}|${id}`).toString('base64')
}

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
