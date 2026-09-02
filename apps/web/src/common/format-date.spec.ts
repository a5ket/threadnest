import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatRelativeTime } from './format-date'

const NOW = new Date('2024-06-15T12:00:00.000Z')

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const secondsAgo = (seconds: number) => new Date(NOW.getTime() - seconds * 1000)

  it('reports under a minute as "just now"', () => {
    expect(formatRelativeTime(secondsAgo(59))).toBe('just now')
  })

  it('switches to minutes at exactly 60 seconds', () => {
    expect(formatRelativeTime(secondsAgo(60))).toBe('1m ago')
  })

  it('reports minutes under an hour', () => {
    expect(formatRelativeTime(secondsAgo(59 * 60))).toBe('59m ago')
  })

  it('switches to hours at exactly 60 minutes', () => {
    expect(formatRelativeTime(secondsAgo(60 * 60))).toBe('1h ago')
  })

  it('reports hours under a day', () => {
    expect(formatRelativeTime(secondsAgo(23 * 60 * 60))).toBe('23h ago')
  })

  it('switches to days at exactly 24 hours', () => {
    expect(formatRelativeTime(secondsAgo(24 * 60 * 60))).toBe('1d ago')
  })

  it('reports days under 30', () => {
    expect(formatRelativeTime(secondsAgo(29 * 24 * 60 * 60))).toBe('29d ago')
  })

  it('switches to months at exactly 30 days', () => {
    expect(formatRelativeTime(secondsAgo(30 * 24 * 60 * 60))).toBe('1mo ago')
  })

  it('reports months under 12', () => {
    expect(formatRelativeTime(secondsAgo(11 * 30 * 24 * 60 * 60))).toBe('11mo ago')
  })

  it('switches to years once the month count reaches 12', () => {
    expect(formatRelativeTime(secondsAgo(400 * 24 * 60 * 60))).toBe('1y ago')
  })

  it('accepts an ISO string in addition to a Date', () => {
    expect(formatRelativeTime(secondsAgo(60).toISOString())).toBe('1m ago')
  })
})
