import { ReportStatus } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createReportPolicySubject } from 'test/factories/report-policy-subject.factory'
import { ReportAlreadyResolvedException } from './exceptions/report-already-resolved.exception'
import { ReportPolicy } from './report.policy'

describe('ReportPolicy', () => {
  const nestAccess = createMockNestAccess()
  const policy = new ReportPolicy(nestAccess as any)

  const givenContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanListQueue', () => {
    it('allows when canModerateContent is true', async () => {
      givenContext({ canModerateContent: true })

      await expect(
        policy.assertCanListQueue('nest-1', 'actor-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canModerateContent is false', async () => {
      givenContext({ canModerateContent: false })

      await expect(
        policy.assertCanListQueue('nest-1', 'actor-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanReview', () => {
    it('allows when canModerateContent is true and the report is pending', async () => {
      givenContext({ canModerateContent: true })
      const report = createReportPolicySubject({ status: ReportStatus.PENDING })

      await expect(
        policy.assertCanReview(report, 'nest-1', 'actor-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canModerateContent is false', async () => {
      givenContext({ canModerateContent: false })
      const report = createReportPolicySubject({ status: ReportStatus.PENDING })

      await expect(
        policy.assertCanReview(report, 'nest-1', 'actor-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws ReportAlreadyResolvedException when the report was already resolved', async () => {
      givenContext({ canModerateContent: true })
      const report = createReportPolicySubject({ status: ReportStatus.RESOLVED })

      await expect(
        policy.assertCanReview(report, 'nest-1', 'actor-1'),
      ).rejects.toThrow(ReportAlreadyResolvedException)
    })

    it('throws ReportAlreadyResolvedException when the report was already dismissed', async () => {
      givenContext({ canModerateContent: true })
      const report = createReportPolicySubject({ status: ReportStatus.DISMISSED })

      await expect(
        policy.assertCanReview(report, 'nest-1', 'actor-1'),
      ).rejects.toThrow(ReportAlreadyResolvedException)
    })

    it('throws InsufficientPermissionsException rather than ReportAlreadyResolvedException when both would fail', async () => {
      givenContext({ canModerateContent: false })
      const report = createReportPolicySubject({ status: ReportStatus.RESOLVED })

      await expect(
        policy.assertCanReview(report, 'nest-1', 'actor-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
