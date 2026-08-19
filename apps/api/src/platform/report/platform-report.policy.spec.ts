import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createPlatformAccessContext } from 'test/factories/platform-access-context.factory'
import { createMockPlatformAccess } from 'test/factories/platform-access.mock-factory'
import { createPlatformReportPolicySubject } from 'test/factories/platform-report-policy-subject.factory'
import { PlatformReportAlreadyResolvedException } from './exceptions/platform-report-already-resolved.exception'
import { PlatformReportPolicy } from './platform-report.policy'

describe('PlatformReportPolicy', () => {
  const platformAccess = createMockPlatformAccess()
  const policy = new PlatformReportPolicy(platformAccess as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertIsModerator', () => {
    it('allows when the actor is a moderator', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))

      await expect(policy.assertIsModerator('actor-1')).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when the actor holds no platform role', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(policy.assertIsModerator('actor-1')).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanReview', () => {
    it('allows when the report is pending', () => {
      const report = createPlatformReportPolicySubject({ status: 'PENDING' })

      expect(() => policy.assertCanReview(report)).not.toThrow()
    })

    it('throws PlatformReportAlreadyResolvedException when the report was already resolved', () => {
      const report = createPlatformReportPolicySubject({ status: 'RESOLVED' })

      expect(() => policy.assertCanReview(report)).toThrow(PlatformReportAlreadyResolvedException)
    })

    it('throws PlatformReportAlreadyResolvedException when the report was already dismissed', () => {
      const report = createPlatformReportPolicySubject({ status: 'DISMISSED' })

      expect(() => policy.assertCanReview(report)).toThrow(PlatformReportAlreadyResolvedException)
    })
  })
})
