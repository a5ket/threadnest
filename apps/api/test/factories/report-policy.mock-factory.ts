import { ReportPolicy } from 'src/report/report.policy'

export const createMockReportPolicy = (): jest.Mocked<Pick<ReportPolicy, 'assertCanReportThread' | 'assertCanListQueue' | 'assertCanReview'>> => ({
  assertCanReportThread: jest.fn(),
  assertCanListQueue: jest.fn(),
  assertCanReview: jest.fn(),
})
