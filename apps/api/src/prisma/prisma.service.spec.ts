import { Prisma } from 'generated/prisma/client'
import { PrismaService } from './prisma.service'

function knownRequestError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('mock prisma error', { code, clientVersion: '7.8.0', meta })
}

describe('PrismaService', () => {
  const config = { getOrThrow: jest.fn().mockReturnValue('postgresql://user:pass@localhost:5432/db') }
  const service = new PrismaService(config as any)

  describe('isUniqueConstraintError', () => {
    it('returns false for a non-Prisma error', () => {
      expect(service.isUniqueConstraintError(new Error('boom'))).toBe(false)
    })

    it('returns false for a Prisma error with a different code', () => {
      expect(service.isUniqueConstraintError(knownRequestError('P2025'))).toBe(false)
    })

    it('returns true for a P2002 error when no field is specified', () => {
      expect(service.isUniqueConstraintError(knownRequestError('P2002'))).toBe(true)
    })

    it('matches a field against a string target (legacy shape)', () => {
      const error = knownRequestError('P2002', { target: 'email' })

      expect(service.isUniqueConstraintError(error, 'email')).toBe(true)
      expect(service.isUniqueConstraintError(error, 'username')).toBe(false)
    })

    it('matches a field against an array target (legacy shape)', () => {
      const error = knownRequestError('P2002', { target: ['nestId', 'slug'] })

      expect(service.isUniqueConstraintError(error, 'slug')).toBe(true)
      expect(service.isUniqueConstraintError(error, 'other')).toBe(false)
    })

    it('matches a field via the driver-adapter constraint shape when target is absent', () => {
      const error = knownRequestError('P2002', {
        driverAdapterError: { cause: { constraint: { fields: ['"email"'] } } },
      })

      expect(service.isUniqueConstraintError(error, 'email')).toBe(true)
      expect(service.isUniqueConstraintError(error, 'username')).toBe(false)
    })

    it('returns false when neither shape is present', () => {
      expect(service.isUniqueConstraintError(knownRequestError('P2002'), 'email')).toBe(false)
    })
  })

  describe('isRecordNotFoundError', () => {
    it('returns true for a P2025 error', () => {
      expect(service.isRecordNotFoundError(knownRequestError('P2025'))).toBe(true)
    })

    it('returns false for a different Prisma error code', () => {
      expect(service.isRecordNotFoundError(knownRequestError('P2002'))).toBe(false)
    })

    it('returns false for a non-Prisma error', () => {
      expect(service.isRecordNotFoundError(new Error('boom'))).toBe(false)
    })
  })
})
