import { ReportPolicy } from 'src/report/report.policy'

export const createMockReportPolicy = (): jest.Mocked<Pick<ReportPolicy, 'assertCanListQueue' | 'assertCanReview'>> => ({
  assertCanListQueue: jest.fn(),
  assertCanReview: jest.fn(),
})
