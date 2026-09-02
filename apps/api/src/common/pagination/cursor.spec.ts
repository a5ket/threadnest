import { decodeCursor, decodeNumericCursor, encodeCursor, encodeNumericCursor } from './cursor'

describe('cursor', () => {
  describe('encodeCursor / decodeCursor', () => {
    it('round-trips a date and id', () => {
      const date = new Date('2026-01-15T10:30:00.000Z')

      const cursor = encodeCursor(date, 'item-1')
      const decoded = decodeCursor(cursor)

      expect(decoded.date.getTime()).toBe(date.getTime())
      expect(decoded.id).toBe('item-1')
    })

    it('throws on garbage input that does not decode into a date and id', () => {
      expect(() => decodeCursor('%%%not-base64%%%')).toThrow('Invalid cursor')
    })

    it('throws when the id segment is missing', () => {
      const cursor = Buffer.from(new Date().toISOString()).toString('base64')

      expect(() => decodeCursor(cursor)).toThrow('Invalid cursor')
    })

    it('throws when the id segment is blank', () => {
      const cursor = Buffer.from(`${new Date().toISOString()}|   `).toString('base64')

      expect(() => decodeCursor(cursor)).toThrow('Invalid cursor')
    })

    it('throws when the date segment is not a valid date', () => {
      const cursor = Buffer.from('not-a-date|item-1').toString('base64')

      expect(() => decodeCursor(cursor)).toThrow('Invalid cursor')
    })
  })

  describe('encodeNumericCursor / decodeNumericCursor', () => {
    it('round-trips a numeric value and id', () => {
      const cursor = encodeNumericCursor(42, 'item-1')
      const decoded = decodeNumericCursor(cursor)

      expect(decoded.value).toBe(42)
      expect(decoded.id).toBe('item-1')
    })

    it('round-trips a negative value', () => {
      const cursor = encodeNumericCursor(-7, 'item-1')
      const decoded = decodeNumericCursor(cursor)

      expect(decoded.value).toBe(-7)
    })

    it('throws when the id segment is missing', () => {
      const cursor = Buffer.from('42').toString('base64')

      expect(() => decodeNumericCursor(cursor)).toThrow('Invalid cursor')
    })

    it('throws when the value segment is not numeric', () => {
      const cursor = Buffer.from('not-a-number|item-1').toString('base64')

      expect(() => decodeNumericCursor(cursor)).toThrow('Invalid cursor')
    })
  })
})
